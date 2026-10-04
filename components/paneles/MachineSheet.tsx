"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Camera, MagnifyingGlass, Trash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { fileToDataUrl, type CatalogItem, type GymMachineInfo } from "@/lib/api";
import { localized, t, type Language } from "@/lib/i18n";

export const EQUIPMENT_KEYS = ["machine", "smith", "barbell", "dumbbell", "bench", "cable", "pullup-bar", "dip-bar", "ghd", "box", "band", "none"] as const;

export type MachineDraft = {
  name: string;
  purpose: string;
  image: string;
  equipmentKey: string;
  weightFactor: number;
  exerciseIds: string[];
};

export function draftFrom(machine: GymMachineInfo | null, language: Language): MachineDraft {
  if (!machine) return { name: "", purpose: "", image: "", equipmentKey: "machine", weightFactor: 1, exerciseIds: [] };
  return {
    name: machine.name_text ?? localized(machine.name, language),
    purpose: machine.purpose_text ?? (machine.purpose ? localized(machine.purpose, language) : ""),
    image: machine.image_url ?? "",
    equipmentKey: machine.equipment_key ?? "machine",
    weightFactor: machine.weight_factor ?? 1,
    exerciseIds: machine.exercise_ids ?? [],
  };
}

/** Add / edit a gym machine: photo, name, purpose, equipment, weight factor and exercises. */
export function MachineSheet({
  open,
  editing,
  initial,
  catalog,
  language,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: boolean;
  initial: MachineDraft;
  catalog: CatalogItem[];
  language: Language;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: MachineDraft) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setQuery("");
      setNameError(null);
    }
  }, [open, initial]);

  const names = useMemo(() => new Map(catalog.map((c) => [c.id, c.name])), [catalog]);
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return (q ? catalog.filter((c) => c.name.toLocaleLowerCase().includes(q)) : catalog).filter((c) => !draft.exerciseIds.includes(c.id)).slice(0, 24);
  }, [catalog, query, draft.exerciseIds]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setNameError(t(language, "maquina.nombreFalta"));
      document.getElementById("maquina-nombre")?.focus();
      return;
    }
    onSave({ ...draft, name: draft.name.trim(), purpose: draft.purpose.trim() });
  };

  const toggle = (id: string) => setDraft((d) => ({ ...d, exerciseIds: d.exerciseIds.includes(id) ? d.exerciseIds.filter((x) => x !== id) : [...d.exerciseIds, id] }));

  return (
    <Dialog open={open} onClose={onClose} variant="sheet" title={t(language, editing ? "maquina.editar" : "maquina.nueva")} closeLabel={t(language, "comun.cerrar")}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {draft.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.image} alt="" width={96} height={96} className="size-24 rounded-ficha object-cover" />
          ) : (
            <span aria-hidden="true" className="grid size-24 place-items-center rounded-ficha bg-fase-suave"><Camera size={32} weight="bold" /></span>
          )}
          <div className="flex flex-col gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-full bg-rosa-claro px-4 font-display font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
              <Camera size={18} weight="bold" aria-hidden="true" />
              {t(language, "maquina.subirFoto")}
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const image = await fileToDataUrl(file);
                  setDraft((d) => ({ ...d, image }));
                }}
              />
            </label>
            {draft.image && (
              <Button variant="fantasma" size="sm" icon={<Trash size={16} weight="bold" />} onClick={() => setDraft({ ...draft, image: "" })} className="self-start">
                {t(language, "maquina.quitarFoto")}
              </Button>
            )}
          </div>
        </div>
        <Field id="maquina-nombre" label={t(language, "maquina.nombre")} error={nameError}>
          {(control) => <Input {...control} value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}
        </Field>
        <Field label={t(language, "maquina.para")} hint={t(language, "maquina.traduccion")}>
          {(control) => <Input {...control} value={draft.purpose} maxLength={120} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t(language, "maquina.tipo")}>
            {(control) => (
              <Select {...control} value={draft.equipmentKey} onChange={(e) => setDraft({ ...draft, equipmentKey: e.target.value })}>
                {EQUIPMENT_KEYS.map((k) => (
                  <option key={k} value={k}>{t(language, `equipo.${k}`)}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={`${t(language, "maquina.factor")} · ×${draft.weightFactor.toFixed(1)}`} hint={t(language, "maquina.factorAyuda")}>
            {(control) => <input {...control} type="range" min={0.5} max={2.5} step={0.1} value={draft.weightFactor} onChange={(e) => setDraft({ ...draft, weightFactor: Number(e.target.value) })} className="h-12 w-full accent-ink" />}
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-small font-extrabold">{t(language, "maquina.ejercicios")}</legend>
          {draft.exerciseIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draft.exerciseIds.map((id) => (
                <Chip key={id} selected onToggle={() => toggle(id)}>{names.get(id) ?? id}</Chip>
              ))}
            </div>
          )}
          <div className="relative">
            <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-suave" />
            <Input type="search" aria-label={t(language, "maquina.buscar")} placeholder={t(language, "maquina.buscar")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12" />
          </div>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {results.map((c) => (
              <Chip key={c.id} selected={false} onToggle={() => toggle(c.id)}>{c.name}</Chip>
            ))}
          </div>
        </fieldset>
        <Button type="submit" size="lg" fullWidth loading={saving} loadingLabel={t(language, "onb.guardando")}>
          {t(language, "maquina.guardar")}
        </Button>
      </form>
    </Dialog>
  );
}
