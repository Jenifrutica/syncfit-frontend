"use client";

import { useEffect, useState } from "react";

import { ExerciseVariant, RoutineEntry, getExerciseVariants } from "@/lib/api";
import { Language, localized, t } from "@/lib/i18n";
import { Dumbbell, Flower } from "@/components/icons";

interface Props {
  entry: RoutineEntry;
  language: Language;
  baselineKg?: number;
  kLoad?: number;
  machineFactor?: number;
  biomarkers?: { delta_temperature_c: number; rmssd_hrv_ms: number; isometric_force_loss_pct: number };
  onClose: () => void;
  onSelectVariant: (variant: ExerciseVariant) => void;
  onRemove: () => void;
}

export function ExerciseDetailModal({
  entry,
  language,
  baselineKg,
  kLoad,
  machineFactor,
  biomarkers,
  onClose,
  onSelectVariant,
  onRemove,
}: Props) {
  const [variants, setVariants] = useState<ExerciseVariant[]>([]);

  useEffect(() => {
    if (!entry.exercise_id) { setVariants([]); return; }
    getExerciseVariants(entry.exercise_id, language)
      .then((all) => setVariants(all.filter((v) => v.id !== entry.exercise_id)))
      .catch(() => setVariants([]));
  }, [entry.exercise_id, language]);

  const factor = machineFactor ?? 1;
  const estimate =
    baselineKg != null && kLoad != null
      ? Math.round(baselineKg * kLoad * factor * 10) / 10
      : entry.weight_suggested_kg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-pink-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-pink-700">
            <Flower size={18} /> {entry.exercise_original}
          </h2>
          <button onClick={onClose} className="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700">{t(language, "close")}</button>
        </div>

        {entry.machine_name && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">
            <Dumbbell size={12} /> {localized(entry.machine_name, language)}
          </span>
        )}

        <div className="mt-3 overflow-hidden rounded-xl border border-pink-100">
          {entry.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image_url} alt={entry.exercise_original} className="h-48 w-full object-cover" />
          ) : null}
          <div className="flex items-center justify-center bg-pink-50/60 py-6 text-sm text-slate-500">
            {t(language, "animationSoon")}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-pink-100 p-3">
            <p className="text-xs uppercase tracking-wide text-pink-400">{t(language, "estimatedWeight")}</p>
            <p className="text-lg font-bold text-slate-800">{estimate} {t(language, "kg")}</p>
            {baselineKg != null && (
              <p className="text-xs text-slate-500">
                {baselineKg}{t(language, "kg")} × {kLoad?.toFixed(2)} × {factor}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-pink-100 p-3">
            <p className="text-xs uppercase tracking-wide text-pink-400">{t(language, "metrics")}</p>
            {biomarkers ? (
              <ul className="text-xs text-slate-600">
                <li>ΔT: {biomarkers.delta_temperature_c} °C</li>
                <li>{t(language, "rmssd")}: {biomarkers.rmssd_hrv_ms} ms</li>
                <li>{t(language, "forceLoss")}: {biomarkers.isometric_force_loss_pct}%</li>
              </ul>
            ) : (
              <p className="text-xs text-slate-500">—</p>
            )}
          </div>
        </div>

        {entry.movement_pattern && (
          <p className="mt-3 text-sm text-slate-700">
            <span className="rounded bg-pink-50 px-2 py-0.5 text-xs uppercase tracking-wide text-pink-700">
              {t(language, "pattern")}: {entry.movement_pattern}
            </span>
          </p>
        )}
        {entry.description && <p className="mt-3 text-sm text-slate-600">{localized(entry.description, language)}</p>}
        {entry.rationale && (
          <p className="mt-2 rounded bg-pink-50 p-2 text-xs text-pink-800">
            <strong>{t(language, "whyChosen")}:</strong> {entry.rationale}
          </p>
        )}

        {variants.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-pink-700">{t(language, "alternatives")}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onSelectVariant(v)}
                  className="rounded-full border border-pink-200 bg-white px-3 py-1 text-sm text-pink-700 hover:border-pink-400"
                >
                  {v.name}{v.equipment_type ? ` · ${v.equipment_type}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onRemove} className="rounded-full bg-white px-4 py-1 text-sm text-slate-500">{t(language, "removeExercise")}</button>
        </div>
      </div>
    </div>
  );
}

export default ExerciseDetailModal;
