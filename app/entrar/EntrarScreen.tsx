"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WarningCircle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Choice } from "@/components/ui/Choice";
import { Field, Input } from "@/components/ui/Field";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Pulsi } from "@/components/mascot/Pulsi";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { SkyShell } from "@/components/brand/SkyShell";
import { LoadingScreen } from "@/components/session/LoadingScreen";
import { explainAuthError, type AuthField } from "@/lib/auth-errors";
import { t } from "@/lib/i18n";
import { homeFor, useSession } from "@/lib/session";
import { isValidDocumentId, isValidEmail, isValidName, isValidNewPassword, normalizeName } from "@/lib/validation";

type Mode = "entrar" | "crear";
type Errors = Partial<Record<AuthField, string>>;

/** Only same-site paths may be used as a post-login destination. */
function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function EntrarScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { status, user, profile, language, signIn, signUp } = useSession();

  const [mode, setMode] = useState<Mode>(params.get("modo") === "crear" ? "crear" : "entrar");
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Already signed in (or just signed in): go where this person belongs.
  useEffect(() => {
    if (status === "ready" && user) {
      const next = safeNext(params.get("next"));
      const home = homeFor(user, profile);
      router.replace(next && home !== "/bienvenida" ? next : home);
    }
  }, [status, user, profile, params, router]);

  if (status !== "anon") return <LoadingScreen />;

  const creating = mode === "crear";

  const check = (field: AuthField): string | undefined => {
    switch (field) {
      case "nombre":
        return creating && !isValidName(nombre) ? t(language, "error.nombre") : undefined;
      case "cedula":
        return creating && !isValidDocumentId(cedula) ? t(language, "error.cedula") : undefined;
      case "correo":
        return isValidEmail(correo) ? undefined : t(language, "error.correo");
      case "clave":
        if (creating) return isValidNewPassword(clave) ? undefined : t(language, "error.clave");
        return clave ? undefined : t(language, "error.claveVacia");
    }
  };

  const onBlur = (field: AuthField) => setErrors((current) => ({ ...current, [field]: check(field) }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const fields: AuthField[] = creating ? ["nombre", "cedula", "correo", "clave"] : ["correo", "clave"];
    const found: Errors = {};
    for (const field of fields) found[field] = check(field);
    setErrors(found);
    const firstInvalid = fields.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`campo-${firstInvalid}`)?.focus();
      return;
    }

    setSending(true);
    try {
      if (creating) {
        await signUp({ email: correo, password: clave, displayName: normalizeName(nombre), documentId: cedula.trim() });
      } else {
        await signIn(correo, clave);
      }
    } catch (error) {
      const { key, field } = explainAuthError(error);
      if (field) {
        setErrors((current) => ({ ...current, [field]: t(language, key) }));
        document.getElementById(`campo-${field}`)?.focus();
      } else {
        setFormError(t(language, key));
      }
      setSending(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
  };

  return (
    <SkyShell aside={<LanguageSwitcher />}>
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex items-start gap-1">
          <Pulsi mood="feliz" size={104} wings animated color="var(--color-ovulatoria)" />
          <SpeechBubble className="-mt-1 text-left">{t(language, creating ? "entrar.burbuja.crear" : "entrar.burbuja.entrar")}</SpeechBubble>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-bold">{t(language, creating ? "entrar.titulo.crear" : "entrar.titulo.entrar")}</h1>
          <p className="text-body-lg font-bold text-ink-suave">{t(language, creating ? "entrar.sub.crear" : "entrar.sub.entrar")}</p>
        </div>
        <Choice
          legend={t(language, "entrar.titulo.entrar")}
          hideLegend
          variant="segmentado"
          value={mode}
          onChange={switchMode}
          className="w-full"
          options={[
            { value: "entrar", label: t(language, "entrar.modo.entrar") },
            { value: "crear", label: t(language, "entrar.modo.crear") },
          ]}
        />
      </div>

      <Card elevated className="mt-5">
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          {creating && (
            <>
              <Field id="campo-nombre" label={t(language, "entrar.nombre")} hint={t(language, "entrar.nombre.ayuda")} error={errors.nombre}>
                {(control) => (
                  <Input {...control} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={() => onBlur("nombre")} />
                )}
              </Field>
              <Field id="campo-cedula" label={t(language, "entrar.cedula")} hint={t(language, "entrar.cedula.ayuda")} error={errors.cedula}>
                {(control) => (
                  <Input
                    {...control}
                   
                    inputMode="numeric"
                    autoComplete="off"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                    onBlur={() => onBlur("cedula")}
                  />
                )}
              </Field>
            </>
          )}
          <Field id="campo-correo" label={t(language, "entrar.correo")} error={errors.correo}>
            {(control) => (
              <Input
                {...control}
               
                type="email"
                autoComplete="email"
                inputMode="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                onBlur={() => onBlur("correo")}
              />
            )}
          </Field>
          <Field id="campo-clave" label={t(language, "entrar.clave")} hint={creating ? t(language, "entrar.clave.ayuda") : undefined} error={errors.clave}>
            {(control) => (
              <PasswordInput
                {...control}
               
                autoComplete={creating ? "new-password" : "current-password"}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                onBlur={() => onBlur("clave")}
                showLabel={t(language, "entrar.clave.mostrar")}
                hideLabel={t(language, "entrar.clave.ocultar")}
              />
            )}
          </Field>

          {formError && (
            <p role="alert" className="flex items-start gap-2 rounded-ficha bg-peligro-suave px-4 py-3 text-small font-bold text-peligro">
              <WarningCircle size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
              {formError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={sending}
            loadingLabel={t(language, creating ? "entrar.cargando.crear" : "entrar.cargando.entrar")}
          >
            {t(language, creating ? "entrar.boton.crear" : "entrar.boton.entrar")}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-small font-bold text-ink-suave">{t(language, "app.aviso")}</p>
    </SkyShell>
  );
}
