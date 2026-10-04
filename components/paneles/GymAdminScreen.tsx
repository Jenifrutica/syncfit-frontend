"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Barbell, Copy, PencilSimple, Plus, QrCode, Trash } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Choice } from "@/components/ui/Choice";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { EmptyState, Skeleton, SkeletonGroup } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { PanelShell } from "@/components/paneles/PanelShell";
import { MachineSheet, draftFrom, type MachineDraft } from "@/components/paneles/MachineSheet";
import {
  addGymMachine,
  createGym,
  deleteGym,
  deleteGymMachine,
  fetchGymQr,
  getCatalog,
  listMyGyms,
  updateGym,
  updateGymMachine,
  type CatalogItem,
  type GymInfo,
  type GymMachineInfo,
} from "@/lib/api";
import { realImage } from "@/lib/routine";
import { localized, t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isValidName } from "@/lib/validation";

type Confirm = { kind: "gym"; gym: GymInfo } | { kind: "machine"; gym: GymInfo; machine: GymMachineInfo };

export function GymAdminScreen() {
  const { language } = useSession();
  const toast = useToast();
  const [gyms, setGyms] = useState<GymInfo[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [qr, setQr] = useState<{ gym: GymInfo; url: string } | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [sheet, setSheet] = useState<{ machine: GymMachineInfo | null } | null>(null);
  const [saving, setSaving] = useState(false);

  const say = (title: string, tone: "exito" | "error" = "exito") => toast({ tone, title, closeLabel: t(language, "comun.cerrar") });

  const load = useCallback(async () => {
    try {
      const list = await listMyGyms(language);
      setGyms(list);
      setSelected((current) => (current && list.some((g) => g.id === current) ? current : (list[0]?.id ?? null)));
    } catch {
      setGyms([]);
      say(t(language, "gym.error"), "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    void load();
    getCatalog(language).then(setCatalog).catch(() => setCatalog([]));
  }, [load, language]);

  const gym = gyms?.find((g) => g.id === selected) ?? null;
  const names = useMemo(() => new Map(catalog.map((c) => [c.id, c.name])), [catalog]);
  const initialDraft = useMemo(() => draftFrom(sheet?.machine ?? null, language), [sheet, language]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidName(newName)) return setNameError(t(language, "gymadmin.nombreInvalido"));
    setCreating(true);
    try {
      const created = await createGym(newName.trim());
      setNewName("");
      setNameError(null);
      setSelected(created.id);
      say(t(language, "gymadmin.creado"));
      await load();
    } catch {
      setNameError(t(language, "gymadmin.nombreInvalido"));
    } finally {
      setCreating(false);
    }
  };

  const rename = async (event: FormEvent) => {
    event.preventDefault();
    if (!gym || renaming === null) return;
    if (!isValidName(renaming)) return say(t(language, "gymadmin.nombreInvalido"), "error");
    try {
      await updateGym(gym.id, renaming.trim(), language);
      setRenaming(null);
      say(t(language, "gymadmin.guardado"));
      await load();
    } catch {
      say(t(language, "gymadmin.error"), "error");
    }
  };

  const showQr = async (g: GymInfo) => {
    try {
      setQr({ gym: g, url: await fetchGymQr(g.id) });
    } catch {
      say(t(language, "gymadmin.error"), "error");
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      say(t(language, "gymadmin.copiado"));
    } catch {
      say(code);
    }
  };

  const saveMachine = async (draft: MachineDraft) => {
    if (!gym) return;
    setSaving(true);
    try {
      if (sheet?.machine) {
        await updateGymMachine(gym.id, sheet.machine.id, {
          name: draft.name,
          purpose: draft.purpose || null,
          image_url: draft.image || null,
          equipment_key: draft.equipmentKey,
          weight_factor: draft.weightFactor,
          exercise_ids: draft.exerciseIds,
        }, language);
      } else {
        await addGymMachine(gym.id, draft.name, draft.purpose || undefined, draft.image || undefined, language, draft.exerciseIds, draft.equipmentKey, undefined, draft.weightFactor);
      }
      setSheet(null);
      say(t(language, "gymadmin.guardado"));
      await load();
    } catch {
      say(t(language, "gymadmin.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "gym") await deleteGym(confirm.gym.id);
      else await deleteGymMachine(confirm.gym.id, confirm.machine.id);
      setConfirm(null);
      await load();
    } catch {
      say(t(language, "gymadmin.error"), "error");
    }
  };

  return (
    <PanelShell title={t(language, "gymadmin.titulo")} subtitle={t(language, "gymadmin.sub")}>
      <Card tone="crema">
        <form onSubmit={create} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field id="nuevo-gym" label={t(language, "gymadmin.nuevo")} error={nameError} className="flex-1">
            {(control) => <Input {...control} value={newName} maxLength={60} onChange={(e) => setNewName(e.target.value)} />}
          </Field>
          <Button type="submit" loading={creating} icon={<Plus size={18} weight="bold" />} className={nameError ? "sm:mb-7" : undefined}>
            {t(language, "gymadmin.crear")}
          </Button>
        </form>
      </Card>

      {!gyms ? (
        <SkeletonGroup label={t(language, "gymadmin.cargando")}>
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </SkeletonGroup>
      ) : gyms.length === 0 ? (
        <Card>
          <EmptyState mood="feliz" title={t(language, "gymadmin.ninguno")} />
        </Card>
      ) : (
        <>
          {gyms.length > 1 && (
            <Choice legend={t(language, "gymadmin.titulo")} hideLegend variant="segmentado" value={selected} onChange={setSelected} options={gyms.map((g) => ({ value: g.id, label: g.name }))} />
          )}

          {gym && (
            <section aria-labelledby="gym-actual" className="flex flex-col gap-5">
              <Card tone="tinta" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {renaming !== null ? (
                    <form onSubmit={rename} className="flex flex-1 flex-wrap items-end gap-2">
                      <label className="flex flex-1 flex-col gap-1 text-small font-extrabold text-lavanda-texto">
                        {t(language, "gymadmin.nombre")}
                        <Input value={renaming} onChange={(e) => setRenaming(e.target.value)} autoFocus />
                      </label>
                      <Button type="submit" variant="secundario">{t(language, "perfil.guardar")}</Button>
                      <Button variant="fantasma" className="text-nube hover:bg-lavanda-noche" onClick={() => setRenaming(null)}>{t(language, "cuenta.cancelar")}</Button>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <h2 id="gym-actual" className="text-h2 font-bold">{gym.name}</h2>
                      <p className="text-small font-bold text-lavanda-texto">{tf(language, "gymadmin.nMaquinas", { n: gym.machines.length })}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-full bg-lavanda-noche py-1.5 pr-1.5 pl-4">
                    <span className="text-caption font-extrabold text-crema">{t(language, "gymadmin.codigo")}</span>
                    <span className="font-display text-h3 font-bold tracking-widest">{gym.code}</span>
                    <IconButton label={t(language, "gymadmin.copiar")} variant="secundario" onClick={() => void copyCode(gym.code)}>
                      <Copy size={18} weight="bold" />
                    </IconButton>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secundario" size="sm" icon={<QrCode size={18} weight="bold" />} onClick={() => void showQr(gym)}>{t(language, "gymadmin.qr")}</Button>
                  <Button variant="secundario" size="sm" icon={<PencilSimple size={18} weight="bold" />} onClick={() => setRenaming(gym.name)}>{t(language, "gymadmin.renombrar")}</Button>
                  <Button variant="peligro" size="sm" icon={<Trash size={18} weight="bold" />} onClick={() => setConfirm({ kind: "gym", gym })}>{t(language, "gymadmin.borrar")}</Button>
                </div>
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-h2 font-bold">{t(language, "compartido.maquinas")}</h2>
                <Button icon={<Plus size={18} weight="bold" />} onClick={() => setSheet({ machine: null })}>{t(language, "gymadmin.agregar")}</Button>
              </div>

              {gym.machines.length === 0 ? (
                <Card>
                  <EmptyState mood="dormida" title={t(language, "gymadmin.sinMaquinas")} action={<Button onClick={() => setSheet({ machine: null })}>{t(language, "gymadmin.agregar")}</Button>} />
                </Card>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gym.machines.map((m) => {
                    const image = realImage(m.image_url);
                    const name = localized(m.name, language) || m.name_text || "";
                    return (
                      <li key={m.id}>
                        <Card padding="sm" className="flex h-full flex-col gap-3">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" width={320} height={180} loading="lazy" className="aspect-[16/9] w-full rounded-ficha object-cover" />
                          ) : (
                            <div aria-hidden="true" className="grid aspect-[16/9] w-full place-items-center rounded-ficha bg-fase-suave"><Barbell size={48} weight="bold" /></div>
                          )}
                          <div className="flex flex-col gap-1">
                            <h3 className="text-h3 font-bold">{name}</h3>
                            <p className="text-small font-bold text-ink-suave">
                              {[localized(m.purpose ?? undefined, language), t(language, `equipo.${m.equipment_key ?? "machine"}`), tf(language, "gym.factor", { n: m.weight_factor })].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {(m.exercise_ids ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(m.exercise_ids ?? []).map((id) => <Badge key={id} tone="lavanda">{names.get(id) ?? id}</Badge>)}
                            </div>
                          )}
                          <div className="mt-auto flex gap-2">
                            <Button variant="suave" size="sm" icon={<PencilSimple size={16} weight="bold" />} className="flex-1" onClick={() => setSheet({ machine: m })}>{t(language, "gymadmin.editar")}</Button>
                            <IconButton label={t(language, "gymadmin.borrarMaquina")} variant="peligro" onClick={() => setConfirm({ kind: "machine", gym, machine: m })}>
                              <Trash size={18} weight="bold" />
                            </IconButton>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      <MachineSheet open={sheet !== null} editing={!!sheet?.machine} initial={initialDraft} catalog={catalog} language={language} saving={saving} onClose={() => setSheet(null)} onSave={(d) => void saveMachine(d)} />

      <Dialog open={qr !== null} onClose={() => setQr(null)} title={qr ? tf(language, "gymadmin.qrTitulo", { gym: qr.gym.name }) : ""} description={qr ? tf(language, "gymadmin.qrDesc", { code: qr.gym.code }) : undefined} closeLabel={t(language, "comun.cerrar")}>
        {qr && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.url} alt={tf(language, "gymadmin.qrTitulo", { gym: qr.gym.name })} width={240} height={240} className="size-60 rounded-ficha bg-nube p-2" />
            <a href={qr.url} download={`qr-${qr.gym.code}.png`} className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-display font-semibold text-nube no-underline">
              {t(language, "gymadmin.descargar")}
            </a>
          </div>
        )}
      </Dialog>

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "gym" ? tf(language, "gymadmin.borrarConfirma", { gym: confirm.gym.name }) : confirm ? tf(language, "gymadmin.borrarMaquinaConfirma", { maquina: localized(confirm.machine.name, language) || confirm.machine.name_text || "" }) : ""}
        description={confirm?.kind === "gym" ? t(language, "gymadmin.borrarDesc") : t(language, "gymadmin.borrarMaquinaDesc")}
        closeLabel={t(language, "comun.cerrar")}
        footer={
          <>
            <Button variant="peligro" onClick={() => void runConfirm()}>{t(language, confirm?.kind === "gym" ? "gymadmin.borrar" : "gymadmin.borrarMaquina")}</Button>
            <Button variant="suave" onClick={() => setConfirm(null)}>{t(language, "cuenta.cancelar")}</Button>
          </>
        }
      >
        {null}
      </Dialog>
    </PanelShell>
  );
}
