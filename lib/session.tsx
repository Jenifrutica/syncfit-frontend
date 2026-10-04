"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getMe, getMyProfile, login, logoutLocal, register, type AuthUser, type MyProfile } from "@/lib/api";
import { LANGUAGES, type Language } from "@/lib/i18n";

export type SessionStatus = "loading" | "anon" | "ready";
export type Role = AuthUser["role"];

type SessionValue = {
  status: SessionStatus;
  user: AuthUser | null;
  /** Athlete profile; null until onboarding is done (and always null for admins). */
  profile: MyProfile | null;
  language: Language;
  setLanguage: (language: Language) => void;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (data: { email: string; password: string; displayName: string; documentId: string }) => Promise<AuthUser>;
  setProfile: (profile: MyProfile | null) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

const LANGUAGE_KEY = "syncfit-language";
const HTML_LANG: Record<Language, string> = { ES: "es", EN: "en", ZH: "zh-Hans" };

function storedLanguage(): Language {
  try {
    const value = window.localStorage.getItem(LANGUAGE_KEY);
    if (value && (LANGUAGES as string[]).includes(value)) return value as Language;
  } catch {
    // Storage can be blocked (private mode); fall back to the default.
  }
  return "ES";
}

async function loadProfile(user: AuthUser): Promise<MyProfile | null> {
  if (user.role !== "ATHLETE") return null;
  return getMyProfile().catch(() => null);
}

/** Where each person lands after signing in. */
export function homeFor(user: AuthUser, profile: MyProfile | null): string {
  if (user.role === "SUPER_ADMIN") return "/admin";
  if (user.role === "GYM_ADMIN") return "/gym";
  return profile ? "/app" : "/bienvenida";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [language, setLanguageState] = useState<Language>("ES");

  useEffect(() => {
    setLanguageState(storedLanguage());
    let cancelled = false;
    (async () => {
      const me = await getMe().catch(() => null);
      const myProfile = me ? await loadProfile(me) : null;
      if (cancelled) return;
      setUser(me);
      setProfile(myProfile);
      setStatus(me ? "ready" : "anon");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }, []);

  const afterAuth = useCallback(async (me: AuthUser) => {
    const myProfile = await loadProfile(me);
    setUser(me);
    setProfile(myProfile);
    setStatus("ready");
    return me;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => afterAuth(await login(email, password)), [afterAuth]);

  const signUp = useCallback<SessionValue["signUp"]>(
    async ({ email, password, displayName, documentId }) => afterAuth(await register(email, password, displayName, documentId)),
    [afterAuth],
  );

  const signOut = useCallback(() => {
    logoutLocal();
    setUser(null);
    setProfile(null);
    setStatus("anon");
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ status, user, profile, language, setLanguage, signIn, signUp, setProfile, signOut }),
    [status, user, profile, language, setLanguage, signIn, signUp, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
