"use client";

import { LANGUAGES, LANGUAGE_LABELS, Language, t } from "@/lib/i18n";
import { Flower } from "@/components/icons";

export interface AuthPanelProps {
  language: Language;
  setLanguage: (l: Language) => void;
  mode: "login" | "register";
  setMode: (m: "login" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  onAuth: () => void;
  error: string | null;
}

export function AuthPanel(props: AuthPanelProps) {
  const { language, setLanguage, mode, setMode, email, setEmail, password, setPassword, name, setName, onAuth, error } = props;
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-pink-600">
        <Flower size={28} /> {t(language, "title")}
      </h1>
      <p className="text-slate-600">{t(language, "subtitle")}</p>
      <div className="mt-6 space-y-3 rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setMode("login")} className={`rounded px-3 py-1 text-sm ${mode === "login" ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-700"}`}>
            {t(language, "signIn")}
          </button>
          <button onClick={() => setMode("register")} className={`rounded px-3 py-1 text-sm ${mode === "register" ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-700"}`}>
            {t(language, "signUp")}
          </button>
        </div>
        {mode === "register" && (
          <input placeholder={t(language, "nameField")} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border border-pink-200 px-3 py-2" />
        )}
        <input placeholder={t(language, "email")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-pink-200 px-3 py-2" />
        <input type="password" placeholder={t(language, "password")} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-pink-200 px-3 py-2" />
        <button onClick={onAuth} className="w-full rounded bg-pink-500 px-4 py-2 text-white hover:bg-pink-600">
          {mode === "login" ? t(language, "signIn") : t(language, "signUp")}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {LANGUAGES.map((lang) => (
          <button key={lang} onClick={() => setLanguage(lang)} className={`rounded px-2 py-1 text-sm ${language === lang ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-700"}`}>
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>
    </main>
  );
}

export default AuthPanel;
