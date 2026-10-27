"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Key, SignOut, Trash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/Toast";
import { ApiError, changePassword, deleteAccount, logoutEverywhere } from "@/lib/api";
import { t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isValidNewPassword } from "@/lib/validation";

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Language, password, sign-out and a clearly separated danger zone. */
export function CuentaCard() {
  const router = useRouter();
  const { language, signOut, user } = useSession();
  const toast = useToast();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const labels = { showLabel: t(language, "entrar.clave.mostrar"), hideLabel: t(language, "entrar.clave.ocultar") };
  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  };

  const leave = () => {
    signOut();
    router.replace("/entrar");
  };

  const phrase = `${t(language, "cuenta.eliminarVerbo")} ${user?.display_name ?? ""}`.trim();
  const matches = normalize(confirm) === normalize(phrase);

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidNewPassword(next)) return setError(t(language, "error.clave"));
    setBusy(true);
    try {
      await changePassword(current, next);
      setPasswordOpen(false);
      reset();
      toast({ tone: "exito", title: t(language, "cuenta.claveCambiada"), closeLabel: t(language, "comun.cerrar") });
    } catch (err) {
      setError(t(language, err instanceof ApiError && err.status === 401 ? "cuenta.claveIncorrecta" : err instanceof ApiError && err.status === 422 ? "cuenta.claveIgual" : err instanceof ApiError && err.status === 429 ? "error.muchosIntentos" : "error.generico"));
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async (event: FormEvent) => {
    event.preventDefault();
    if (!matches) return;
    setBusy(true);
    try {
      await deleteAccount(confirm);
      leave();
    } catch (err) {
      setError(t(language, err instanceof ApiError && err.status === 403 ? "cuenta.fraseIncorrecta" : "error.generico"));
      setBusy(false);
    }
  };

  const everywhere = async () => {
    await logoutEverywhere().catch(() => null);
    leave();
  };

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-h3 font-bold">{t(language, "cuenta.titulo")}</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-small font-extrabold">{t(language, "comun.idioma")}</span>
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button variant="suave" icon={<Key size={18} weight="bold" />} onClick={() => { reset(); setPasswordOpen(true); }}>
          {t(language, "cuenta.clave")}
        </Button>
        <Button variant="suave" icon={<SignOut size={18} weight="bold" />} onClick={leave}>
          {t(language, "cuenta.salir")}
        </Button>
        <Button variant="suave" onClick={() => void everywhere()}>
          {t(language, "cuenta.salirTodos")}
        </Button>
      </div>

      <div className="mt-1 flex flex-col gap-3 rounded-ficha bg-peligro-suave p-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-body-lg font-bold text-peligro">{t(language, "cuenta.peligro.titulo")}</h3>
          <p className="text-small font-bold text-peligro">{t(language, "cuenta.peligro.desc")}</p>
        </div>
        <Button
          variant="secundario"
          icon={<Trash size={18} weight="bold" />}
          className="self-start text-peligro"
          onClick={() => { reset(); setDeleteOpen(true); }}
        >
          {t(language, "cuenta.eliminar")}
        </Button>
      </div>

      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} title={t(language, "cuenta.clave")} closeLabel={t(language, "comun.cerrar")}>
        <form onSubmit={submitPassword} noValidate className="flex flex-col gap-4">
          <Field label={t(language, "cuenta.claveActual")}>
            {(control) => <PasswordInput {...control} {...labels} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}
          </Field>
          <Field label={t(language, "cuenta.claveNueva")} hint={t(language, "entrar.clave.ayuda")} error={error}>
            {(control) => <PasswordInput {...control} {...labels} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
          </Field>
          <Button type="submit" loading={busy} fullWidth>{t(language, "cuenta.claveGuardar")}</Button>
        </form>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t(language, "cuenta.eliminar")} description={t(language, "cuenta.borrarDesc")} closeLabel={t(language, "comun.cerrar")}>
        <form onSubmit={submitDelete} noValidate className="flex flex-col gap-4">
          <p className="text-small font-bold text-ink-suave">{tf(language, "cuenta.eliminarConfirma", { frase: phrase })}</p>
          <Field label={t(language, "cuenta.eliminarFrase")} error={error}>
            {(control) => <Input {...control} autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
          </Field>
          <Button type="submit" variant="peligro" loading={busy} disabled={!matches} fullWidth>{t(language, "cuenta.eliminarBoton")}</Button>
          <Button variant="suave" fullWidth onClick={() => setDeleteOpen(false)}>{t(language, "cuenta.cancelar")}</Button>
        </form>
      </Dialog>
    </Card>
  );
}
