"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { t, type Language } from "@/lib/i18n";

type TokenResponse = { access_token?: string; error?: string };

type TokenClient = { requestAccessToken: () => void };

type TokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
        };
      };
    };
  }
}

const SCRIPT_ID = "google-identity-services";

function loadScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("google script failed")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google script failed"));
    document.head.appendChild(script);
  });
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.6 5.9c4.5-4.2 6.6-10.3 6.6-17.2z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.1-5.5l-7.6-5.9c-2.1 1.5-4.9 2.5-7.5 2.5-6.3 0-11.7-3.7-13.6-9.3l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/**
 * Custom-styled Google button. The Google-rendered iframe cannot use the app
 * font, so this opens the OAuth consent popup with Google Identity Services and
 * sends the access token to the backend for verification.
 */
export function GoogleButton({
  onToken,
  onError,
  language,
  disabled = false,
}: {
  onToken: (accessToken: string) => void;
  onError?: () => void;
  language: Language;
  disabled?: boolean;
}) {
  const client = useRef<TokenClient | null>(null);
  const tokenRef = useRef(onToken);
  const errorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    tokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.google || !clientId) return;
        client.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: (response) => {
            if (response.access_token) tokenRef.current(response.access_token);
            else if (response.error && response.error !== "popup_closed_by_user" && response.error !== "access_denied") {
              errorRef.current?.();
            }
          },
        });
        setReady(true);
      })
      .catch(() => errorRef.current?.());
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <Button
      variant="secundario"
      size="lg"
      fullWidth
      icon={<GoogleG />}
      disabled={disabled || !ready}
      onClick={() => client.current?.requestAccessToken()}
    >
      {t(language, "entrar.google")}
    </Button>
  );
}
