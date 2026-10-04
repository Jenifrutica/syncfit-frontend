"use client";

import { useEffect, useState } from "react";
import { ArrowSquareOut, Copy, LinkSimple, Trash } from "@phosphor-icons/react";

import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Choice } from "@/components/ui/Choice";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { createShare, deleteShare, listShares, type ShareLinkInfo, type SharePermission, type ShareRole } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const ROLES: ShareRole[] = ["TRAINER", "COACH", "PARTNER", "FRIEND", "FAMILY", "OTHER"];
const PERMISSIONS: SharePermission[] = ["PROFILE", "ROUTINE", "CALENDAR", "PROGRESS", "SUPPLEMENTS", "MACHINES", "LOADS"];

export function shareUrl(token: string): string {
  return typeof window === "undefined" ? `/compartido/${token}` : `${window.location.origin}/compartido/${token}`;
}

/** Read-only links for a coach or someone the athlete trusts. */
export function CompartirCard() {
  const { language } = useSession();
  const toast = useToast();
  const [links, setLinks] = useState<ShareLinkInfo[]>([]);
  const [role, setRole] = useState<ShareRole>("TRAINER");
  const [label, setLabel] = useState("");
  const [permissions, setPermissions] = useState<SharePermission[]>(["PROFILE", "ROUTINE", "PROGRESS"]);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ShareLinkInfo | null>(null);
  const say = (title: string, tone: "exito" | "error" = "exito") => toast({ tone, title, closeLabel: t(language, "comun.cerrar") });

  useEffect(() => {
    listShares().then(setLinks).catch(() => setLinks([]));
  }, []);

  const create = async () => {
    if (permissions.length === 0) return say(t(language, "compartir.eligePermiso"), "error");
    setCreating(true);
    try {
      const link = await createShare(role, permissions, label.trim() || undefined);
      setLinks((l) => [link, ...l]);
      setLabel("");
      say(t(language, "compartir.creado"));
    } catch {
      say(t(language, "nutri.errorGuardar"), "error");
    } finally {
      setCreating(false);
    }
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      say(t(language, "compartir.copiado"));
    } catch {
      say(shareUrl(token));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    await deleteShare(deleting.token).catch(() => null);
    setLinks((l) => l.filter((x) => x.token !== deleting.token));
    setDeleting(null);
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 font-bold">{t(language, "compartir.titulo")}</h2>
        <p className="text-small font-bold text-ink-suave">{t(language, "compartir.desc")}</p>
      </div>
      <Choice legend={t(language, "compartir.con")} variant="pildoras" columns={3} value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r, label: <span className="text-small">{t(language, `rol.${r}`)}</span> }))} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-small font-extrabold">{t(language, "compartir.permisos")}</legend>
        <div className="flex flex-wrap gap-2">
          {PERMISSIONS.map((p) => (
            <Chip key={p} selected={permissions.includes(p)} onToggle={() => setPermissions((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]))}>
              {t(language, `permiso.${p}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      <Field label={t(language, "compartir.etiqueta")}>
        {(control) => <Input {...control} value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} />}
      </Field>
      <Button onClick={() => void create()} loading={creating} loadingLabel={t(language, "compartir.creando")} icon={<LinkSimple size={18} weight="bold" />} className="self-start">
        {t(language, "compartir.crear")}
      </Button>

      {links.length === 0 ? (
        <p className="text-small font-bold text-ink-suave">{t(language, "compartir.ninguno")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.token} className="flex flex-wrap items-center justify-between gap-2 rounded-ficha bg-rosa-claro px-4 py-3">
              <div className="min-w-0">
                <p className="font-display text-body font-semibold">{link.label || t(language, `rol.${link.role}`)}</p>
                <p className="text-caption font-extrabold text-ink-suave">{link.permissions.map((p) => t(language, `permiso.${p}`)).join(" · ")}</p>
              </div>
              <div className="flex gap-1">
                <IconButton label={t(language, "compartir.copiar")} variant="secundario" onClick={() => void copy(link.token)}>
                  <Copy size={18} weight="bold" />
                </IconButton>
                <a href={shareUrl(link.token)} target="_blank" rel="noreferrer" aria-label={t(language, "compartir.abrir")} className="grid size-11 place-items-center rounded-full bg-nube text-ink hover:bg-rosa-claro">
                  <ArrowSquareOut size={18} weight="bold" aria-hidden="true" />
                </a>
                <IconButton label={t(language, "compartir.borrar")} variant="peligro" onClick={() => setDeleting(link)}>
                  <Trash size={18} weight="bold" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t(language, "compartir.borrarConfirma")}
        description={t(language, "compartir.borrarDesc")}
        closeLabel={t(language, "comun.cerrar")}
        footer={
          <>
            <Button variant="peligro" onClick={() => void remove()}>{t(language, "compartir.borrar")}</Button>
            <Button variant="suave" onClick={() => setDeleting(null)}>{t(language, "cuenta.cancelar")}</Button>
          </>
        }
      >
        {null}
      </Dialog>
    </Card>
  );
}
