"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { getSymptoms, updateMyProfile, type SymptomInfo } from "@/lib/api";
import { t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/** Full symptom log: which ones, pain 0–10 per symptom and overall, and free notes. */
export function SintomasCard() {
  const { profile, language, setProfile } = useSession();
  const toast = useToast();
  const [catalog, setCatalog] = useState<SymptomInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [pain, setPain] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSymptoms(language).then(setCatalog).catch(() => setCatalog([]));
  }, [language]);

  useEffect(() => {
    setSelected(profile?.symptoms ?? []);
    setPain(profile?.pain_levels ?? {});
    setNotes(profile?.symptom_notes ?? "");
  }, [profile]);

  const modality = profile?.modality ?? "MENSTRUAL_CYCLE";
  const available = catalog.filter((s) => s.modality === "ANY" || s.modality === modality);

  const save = async () => {
    setSaving(true);
    try {
      setProfile(await updateMyProfile({ symptoms: selected, pain_levels: pain, symptom_notes: notes }));
      toast({ tone: "exito", title: t(language, "sentir.guardado"), closeLabel: t(language, "comun.cerrar") });
    } catch {
      toast({ tone: "error", title: t(language, "sentir.error"), closeLabel: t(language, "comun.cerrar") });
    } finally {
      setSaving(false);
    }
  };

  const slider = (id: string, label: string) => (
    <div key={id} className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={`dolor-${id}`} className="text-small font-extrabold">{label}</label>
        <output htmlFor={`dolor-${id}`} className="font-display font-semibold tabular-nums">{tf(language, "sentir.dolorValor", { n: pain[id] ?? 0 })}</output>
      </div>
      <input id={`dolor-${id}`} type="range" min={0} max={10} value={pain[id] ?? 0} onChange={(e) => setPain((p) => ({ ...p, [id]: Number(e.target.value) }))} className="h-11 w-full accent-ink" />
    </div>
  );

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 font-bold">{t(language, "perfil.sintomas")}</h2>
        <p className="text-small font-bold text-ink-suave">{t(language, "perfil.sintomas.desc")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((s) => (
          <Chip key={s.id} selected={selected.includes(s.id)} onToggle={() => setSelected((c) => (c.includes(s.id) ? c.filter((x) => x !== s.id) : [...c, s.id]))}>
            {s.name}
          </Chip>
        ))}
      </div>
      {slider("OVERALL", t(language, "sentir.dolor"))}
      {available.filter((s) => selected.includes(s.id)).map((s) => slider(s.id, s.name))}
      <label className="flex flex-col gap-1.5 text-small font-extrabold">
        {t(language, "perfil.sintomas.notas")}
        <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Button onClick={() => void save()} loading={saving} loadingLabel={t(language, "sentir.guardando")} className="self-start">
        {t(language, "perfil.sintomas.guardar")}
      </Button>
    </Card>
  );
}
