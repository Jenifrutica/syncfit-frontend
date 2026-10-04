"use client";

import { useEffect, useState } from "react";
import { WarningOctagon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { updateMyProfile, type EnergyLevel, type SymptomInfo } from "@/lib/api";
import { readEnergy, saveEnergy } from "@/lib/energia";
import { t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const ENERGIES: EnergyLevel[] = ["ENERGY", "MODERATE", "NO_ENERGY"];

/**
 * Flo-style quick log: energy, symptoms and overall pain in one sheet.
 * Symptoms and pain go to the profile (the routine engine reads them);
 * energy stays on this device for today and pre-fills the next capture.
 */
export function FeelingSheet({ open, onClose, symptoms, today }: { open: boolean; onClose: () => void; symptoms: SymptomInfo[]; today: string }) {
  const { profile, language, setProfile } = useSession();
  const toast = useToast();
  const [energy, setEnergy] = useState<EnergyLevel>("MODERATE");
  const [selected, setSelected] = useState<string[]>([]);
  const [pain, setPain] = useState(0);
  const [saving, setSaving] = useState(false);

  // Start from what is already saved every time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setEnergy(readEnergy(today) ?? "MODERATE");
    setSelected(profile?.symptoms ?? []);
    setPain(profile?.pain_levels?.OVERALL ?? 0);
  }, [open, profile, today]);

  const modality = profile?.modality ?? "MENSTRUAL_CYCLE";
  const available = symptoms.filter((s) => s.modality === "ANY" || s.modality === modality);
  const chosen = available.filter((s) => selected.includes(s.id));
  const blocking = chosen.filter((s) => s.block_training);

  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateMyProfile({ symptoms: selected, pain_levels: { ...(profile?.pain_levels ?? {}), OVERALL: pain } });
      saveEnergy(today, energy);
      setProfile(updated);
      toast({ tone: "exito", title: t(language, "sentir.guardado"), closeLabel: t(language, "comun.cerrar") });
      onClose();
    } catch {
      toast({ tone: "error", title: t(language, "sentir.error"), closeLabel: t(language, "comun.cerrar") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="sheet"
      title={t(language, "sentir.titulo")}
      description={t(language, "sentir.desc")}
      closeLabel={t(language, "comun.cerrar")}
      footer={
        <Button fullWidth size="lg" onClick={save} loading={saving} loadingLabel={t(language, "sentir.guardando")}>
          {t(language, "sentir.guardar")}
        </Button>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-small font-extrabold">{t(language, "sentir.energia")}</legend>
        <div className="flex flex-wrap gap-2">
          {ENERGIES.map((level) => (
            <Chip key={level} selected={energy === level} onToggle={() => setEnergy(level)}>
              {t(language, `energia.${level}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {available.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-small font-extrabold">{t(language, "sentir.sintomas")}</legend>
          <div className="flex flex-wrap gap-2">
            {available.map((symptom) => (
              <Chip key={symptom.id} selected={selected.includes(symptom.id)} onToggle={() => toggle(symptom.id)}>
                {symptom.name}
              </Chip>
            ))}
          </div>
          {chosen.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1.5">
              {chosen.map((symptom) => (
                <li key={symptom.id} className="text-small font-bold text-ink-suave">
                  <span className="text-ink">{symptom.name}:</span> {symptom.advice}
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}

      {blocking.length > 0 && (
        <p role="alert" className="flex items-start gap-2 rounded-ficha bg-peligro-suave px-4 py-3 text-small font-bold text-peligro">
          <WarningOctagon size={22} weight="bold" aria-hidden="true" className="shrink-0" />
          {blocking.map((s) => s.advice).join(" ")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="dolor-general" className="text-small font-extrabold">
            {t(language, "sentir.dolor")}
          </label>
          <output htmlFor="dolor-general" className="font-display text-body-lg font-semibold tabular-nums">
            {tf(language, "sentir.dolorValor", { n: pain })}
          </output>
        </div>
        <input
          id="dolor-general"
          type="range"
          min={0}
          max={10}
          step={1}
          value={pain}
          onChange={(e) => setPain(Number(e.target.value))}
          className="h-11 w-full accent-ink"
        />
      </div>
    </Dialog>
  );
}
