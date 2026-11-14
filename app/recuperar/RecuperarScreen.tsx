"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Pulsi } from "@/components/mascot/Pulsi";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { SkyShell } from "@/components/brand/SkyShell";
import { checkResetToken, forgotPassword, resetPassword } from "@/lib/api";
import { t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isValidEmail, isValidNewPassword } from "@/lib/validation";

type View = "loading" | "request" | "reset" | "sent" | "done" | "invalid";

export function RecuperarScreen() {
  const params = useSearchParams();
  const { language } = useSession();
  const token = params.get("token");

  const [view, setView] = useState<View>(token ? "loading" : "request");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    checkResetToken(token)
      .then((data) => {
        if (!alive) return;
        setEmail(data.email);
        setView("reset");
      })
      .catch(() => {
        if (alive) setView("invalid");
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const requestLink = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError(t(language, "error.correo"));
      return;
    }
    setSending(true);
    try {
      await forgotPassword(email);
      setView("sent");
    } catch {
      setError(t(language, "recuperar.error"));
    } finally {
      setSending(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isValidNewPassword(clave)) {
      setError(t(language, "error.clave"));
      return;
    }
    if (clave !== repetida) {
      setError(t(language, "recuperar.noCoincide"));
      return;
    }
    setSending(true);
    try {
      await resetPassword(token ?? "", email, clave);
      setView("done");
    } catch {
      setError(t(language, "recuperar.error"));
    } finally {
      setSending(false);
    }
  };

  const title =
    view === "reset" || view === "done"
      ? t(language, "recuperar.nuevaTitulo")
      : t(language, "recuperar.titulo");
  const subtitle =
    view === "reset" || view === "done"
      ? tf(language, "recuperar.nuevaSub", { email })
      : t(language, "recuperar.sub");

  return (
    <SkyShell aside={<LanguageSwitcher />}>
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex items-start gap-1">
          <Pulsi mood="feliz" size={104} wings animated color="var(--color-ovulatoria)" />
          <SpeechBubble className="-mt-1 text-left">{t(language, "recuperar.burbuja")}</SpeechBubble>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-bold">{title}</h1>
          <p className="text-body-lg font-bold text-ink-suave">{subtitle}</p>
        </div>
      </div>

      <Card elevated className="mt-5">
        {view === "loading" && (
          <p role="status" className="py-6 text-center text-body font-bold text-ink-suave">
            {t(language, "recuperar.validando")}
          </p>
        )}

        {view === "invalid" && (
          <div className="flex flex-col gap-4">
            <p role="alert" className="flex items-start gap-2 rounded-ficha bg-peligro-suave px-4 py-3 text-small font-bold text-peligro">
              <WarningCircle size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
              {t(language, "recuperar.invalido")}
            </p>
            <ButtonLink href="/recuperar/" variant="secundario" fullWidth>
              {t(language, "recuperar.otro")}
            </ButtonLink>
          </div>
        )}

        {view === "request" && (
          <form noValidate onSubmit={requestLink} className="flex flex-col gap-4">
            <Field id="recuperar-correo" label={t(language, "recuperar.correo")}>
              {(control) => (
                <Input
                  {...control}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-ficha bg-peligro-suave px-4 py-3 text-small font-bold text-peligro">
                <WarningCircle size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" size="lg" fullWidth loading={sending} loadingLabel={t(language, "recuperar.enviando")}>
              {t(language, "recuperar.enviar")}
            </Button>
          </form>
        )}

        {view === "sent" && (
          <div className="flex flex-col gap-4">
            <p role="status" className="flex items-start gap-2 rounded-ficha bg-fase-suave px-4 py-3 text-small font-bold">
              <CheckCircle size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
              {t(language, "recuperar.enviado")}
            </p>
            <ButtonLink href="/entrar/" variant="secundario" fullWidth>
              {t(language, "recuperar.volver")}
            </ButtonLink>
          </div>
        )}

        {view === "reset" && (
          <form noValidate onSubmit={changePassword} className="flex flex-col gap-4">
            <Field id="recuperar-clave" label={t(language, "recuperar.clave")} hint={t(language, "entrar.clave.ayuda")}>
              {(control) => (
                <PasswordInput
                  {...control}
                  autoComplete="new-password"
                  value={clave}
                  onChange={(event) => setClave(event.target.value)}
                  showLabel={t(language, "entrar.clave.mostrar")}
                  hideLabel={t(language, "entrar.clave.ocultar")}
                />
              )}
            </Field>
            <Field id="recuperar-confirmar" label={t(language, "recuperar.confirmar")}>
              {(control) => (
                <PasswordInput
                  {...control}
                  autoComplete="new-password"
                  value={repetida}
                  onChange={(event) => setRepetida(event.target.value)}
                  showLabel={t(language, "entrar.clave.mostrar")}
                  hideLabel={t(language, "entrar.clave.ocultar")}
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-ficha bg-peligro-suave px-4 py-3 text-small font-bold text-peligro">
                <WarningCircle size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" size="lg" fullWidth loading={sending} loadingLabel={t(language, "recuperar.guardando")}>
              {t(language, "recuperar.guardar")}
            </Button>
          </form>
        )}

        {view === "done" && (
          <div className="flex flex-col gap-4">
            <p role="status" className="flex items-start gap-2 rounded-ficha bg-fase-suave px-4 py-3 text-small font-bold">
              <CheckCircle size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
              {t(language, "recuperar.listo")}
            </p>
            <ButtonLink href="/entrar/" fullWidth>
              {t(language, "recuperar.entrar")}
            </ButtonLink>
          </div>
        )}
      </Card>

      <p className="mt-6 text-center text-small font-bold text-ink-suave">
        <Link href="/entrar/" className="underline underline-offset-4">
          {t(language, "recuperar.volver")}
        </Link>
      </p>
    </SkyShell>
  );
}
