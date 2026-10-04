"use client";

import { useEffect, useState } from "react";
import { Barbell, Lightbulb, Trash } from "@phosphor-icons/react";

import { Badge, Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ExerciseThumb } from "@/components/rutina/ExerciseThumb";
import { getExerciseVariants, getJoinedGyms, type ExerciseVariant } from "@/lib/api";
import { localized, t, tf, type Language } from "@/lib/i18n";
import type { RoutineItem, RoutineSummary } from "@/lib/routine";
import { useSession } from "@/lib/session";

type DetailProps = {
  item: RoutineItem | null;
  summary: RoutineSummary;
  language: Language;
  onClose: () => void;
  onVariant: (variant: ExerciseVariant) => void;
  onRemove: () => void;
};

/** Everything about one exercise: media, dose by set type, weight estimate, biomarkers and why it was chosen. */
export function DetailSheet(props: DetailProps) {
  const { item, language, onClose } = props;
  return (
    <Dialog open={item !== null} onClose={onClose} title={item?.name ?? ""} closeLabel={t(language, "comun.cerrar")} variant="sheet">
      {item && <DetailBody {...props} item={item} />}
    </Dialog>
  );
}

function DetailBody({
  item,
  summary,
  language,
  onVariant,
  onRemove,
}: DetailProps & { item: RoutineItem }) {
  const { profile } = useSession();
  const [variants, setVariants] = useState<ExerciseVariant[]>([]);
  const [machineFactor, setMachineFactor] = useState<number | null>(null);

  useEffect(() => {
    setVariants([]);
    setMachineFactor(null);
    if (!item?.exerciseId) return;
    getExerciseVariants(item.exerciseId, language)
      .then((all) => setVariants(all.filter((v) => v.id !== item.exerciseId)))
      .catch(() => setVariants([]));
    if (item.machineId) {
      getJoinedGyms(language)
        .then((gyms) => setMachineFactor(gyms.flatMap((g) => g.machines).find((m) => m.id === item.machineId)?.weight_factor ?? null))
        .catch(() => setMachineFactor(null));
    }
  }, [item, language]);

  const baseline = profile?.loads.find((l) => l.exercise_id === item.exerciseId)?.weight_kg;
  const factor = machineFactor ?? 1;
  const estimate = baseline != null ? Math.round(baseline * summary.k_load * factor * 10) / 10 : null;
  const bySet = item.sets.reduce<Record<string, { count: number; reps: number; kg: number; rest: number }>>((acc, set) => {
    acc[set.type] ??= { count: 0, reps: set.reps, kg: set.weight_kg, rest: set.rest_seconds };
    acc[set.type].count += 1;
    return acc;
  }, {});
  const biomarkers = summary.biomarkers;

  return (
    <>
      <ExerciseThumb name={item.name} imageUrl={item.imageUrl} mediaUrl={item.mediaUrl} size="lg" />

      {item.machineName && (
        <Badge tone="lavanda" icon={<Barbell size={14} weight="bold" />}>
          {localized(item.machineName, language)}
        </Badge>
      )}

      {Object.keys(bySet).length > 0 && (
        <section aria-labelledby="detalle-series" className="flex flex-col gap-2">
          <h3 id="detalle-series" className="text-small font-extrabold">
            {t(language, "detalle.series")}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {Object.entries(bySet).map(([type, info]) => (
              <li key={type} className="flex items-baseline justify-between gap-3 rounded-ficha bg-rosa-claro px-4 py-2.5">
                <span className="font-display text-body font-semibold">{t(language, `set.${type}`)}</span>
                <span className="text-small font-extrabold tabular-nums">
                  {info.count} × {info.reps} · {info.kg > 0 ? tf(language, "rutina.kg", { n: info.kg }) : t(language, "rutina.pesoLibre")} · {info.rest}s
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-ficha bg-fase-suave p-4">
          <p className="text-small font-extrabold">{t(language, "detalle.pesoEstimado")}</p>
          {estimate != null ? (
            <>
              <p className="font-display text-h2 font-bold tabular-nums">{tf(language, "rutina.kg", { n: estimate })}</p>
              <p className="text-caption font-extrabold tabular-nums">
                {baseline} kg × {summary.k_load.toFixed(2)} × {factor}
              </p>
            </>
          ) : (
            <p className="text-small font-bold text-ink-suave">{t(language, "detalle.sinBase")}</p>
          )}
        </div>
        {biomarkers && (
          <div className="rounded-ficha bg-rosa-claro p-4">
            <p className="text-small font-extrabold">{t(language, "detalle.biomarcadores")}</p>
            <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 text-small font-bold tabular-nums">
              <dt>{t(language, "detalle.temp")}</dt>
              <dd>+{biomarkers.delta_temperature_c} °C</dd>
              <dt>{t(language, "detalle.rmssd")}</dt>
              <dd>{biomarkers.rmssd_hrv_ms} ms</dd>
              <dt>{t(language, "detalle.fuerza")}</dt>
              <dd>{biomarkers.isometric_force_loss_pct} %</dd>
            </dl>
          </div>
        )}
      </div>

      {item.movementPattern && (
        <p className="text-small font-bold">
          {t(language, "detalle.patron")}: {t(language, `patron.${item.movementPattern}`)}
        </p>
      )}
      {item.rationale && (
        <p className="flex items-start gap-2 rounded-ficha bg-crema p-4 text-body">
          <Lightbulb size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            <strong>{t(language, "detalle.porque")}:</strong> {item.rationale}
          </span>
        </p>
      )}
      {item.howTo || item.description ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-small font-extrabold">{t(language, "detalle.como")}</h3>
          <p className="text-body">{localized(item.howTo ?? item.description, language)}</p>
        </section>
      ) : null}
      {item.tips && item.tips.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="text-small font-extrabold">{t(language, "detalle.consejos")}</h3>
          <ul className="list-inside list-disc text-body">
            {item.tips.map((tip, i) => (
              <li key={i}>{localized(tip, language)}</li>
            ))}
          </ul>
        </section>
      )}
      {variants.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-small font-extrabold">{t(language, "detalle.variantes")}</h3>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <Chip key={v.id} selected={false} onToggle={() => onVariant(v)}>
                {v.name}
              </Chip>
            ))}
          </div>
        </section>
      )}

      <Button variant="peligro" icon={<Trash size={18} weight="bold" />} onClick={onRemove}>
        {t(language, "detalle.quitar")}
      </Button>
    </>
  );
}
