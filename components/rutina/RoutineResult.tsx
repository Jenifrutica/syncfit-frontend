"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, Fingerprint, Play, ShieldCheck, Warning } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SensorImpact } from "@/components/rutina/SensorImpact";
import { EmptyState } from "@/components/ui/States";
import { Pulsi } from "@/components/mascot/Pulsi";
import { moodFromDecision } from "@/components/mascot/mood";
import { ExerciseCard } from "@/components/rutina/ExerciseCard";
import { ChangeSheet } from "@/components/rutina/ChangeSheet";
import { DetailSheet } from "@/components/rutina/DetailSheet";
import { CASCADA, DUR, EASE } from "@/lib/motion";
import { faseLabel, isFase } from "@/lib/fases";
import { t, tf, type Language } from "@/lib/i18n";
import { loadPercent, swapExercise, totalMinutes, type RoutinePlan } from "@/lib/routine";
import { useRoutine } from "@/lib/routine-context";

type AssessmentInfo = { autonomic_status?: string; articular_risk_pct?: number; contraindicated_patterns?: string[] };

const HORA: Record<Language, Intl.DateTimeFormat> = {
  ES: new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }),
  EN: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }),
  ZH: new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }),
};

export function RoutineResult({
  plan,
  language,
  onNew,
  onRecapture,
}: {
  plan: RoutinePlan;
  language: Language;
  onNew: () => void;
  /** Reopens the sensor capture (optional: only the routine flow offers it). */
  onRecapture?: () => void;
}) {
  const { updateItem, removeItem } = useRoutine();
  const reduceMotion = useReducedMotion();
  const [changeKey, setChangeKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const { summary } = plan;
  const all = [...plan.warmup, ...plan.items];
  const changing = all.find((i) => i.key === changeKey) ?? null;
  const detail = all.find((i) => i.key === detailKey) ?? null;
  const assessment = (summary.assessment ?? {}) as AssessmentInfo;
  const alerts = summary.alerts ?? [];
  const mood = moodFromDecision({ fatigueLevel: summary.fatigue_level, kLoad: summary.k_load, hasAlerts: alerts.length > 0 });
  const fase = isFase(summary.phase_inferred) ? summary.phase_inferred : null;
  const avoided = (assessment.contraindicated_patterns ?? []).map((p) => t(language, `patron.${p}`));
  const empty = plan.items.length === 0;

  const enter = (index: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: reduceMotion ? 0 : -40 },
    transition: { duration: DUR.panel, ease: EASE.salida, delay: reduceMotion ? 0 : index * CASCADA },
  });

  const emptyReason = plan.summary.empty_reason ?? null;
  const emptyTitle = emptyReason ? t(language, `rutina.vacia.${emptyReason}`) : t(language, "rutina.vacia");
  const sensores = plan.sensores;
  const tomado = sensores ? new Date(sensores.at) : null;
  const hora = tomado && !Number.isNaN(tomado.getTime()) ? HORA[language].format(tomado) : null;
  const biomarkers = plan.summary.biomarkers;
  const fromDevice = plan.summary.capture_source === "device" && !!biomarkers;
  const lecturas: [string, string][] = fromDevice && biomarkers
    ? [
        [
          t(language, "rutina.sensores.tempDelta"),
          `${biomarkers.delta_temperature_c >= 0 ? "+" : ""}${biomarkers.delta_temperature_c.toFixed(2)} °C`,
        ],
        [t(language, "rutina.sensores.rmssd"), `${Math.round(biomarkers.rmssd_hrv_ms)} ms`],
        [t(language, "rutina.sensores.perdida"), `${Math.round(biomarkers.isometric_force_loss_pct)} %`],
      ]
    : sensores
      ? [
          [t(language, "captura.pulso"), `${sensores.bpm} bpm`],
          [t(language, "captura.fuerza"), `${sensores.forceKg.toFixed(1)} kg`],
          [t(language, "captura.temperaturaCorta"), `${sensores.tempC.toFixed(1)} °C`],
        ]
      : [];

  return (
    <div className="flex flex-col gap-5" data-routine-result>
      <h1 className="text-h1 font-bold">{t(language, "rutina.titulo")}</h1>

      {(sensores || fromDevice) && (
        <Card tone="fase-suave" className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-nube/70 text-ink">
              <Fingerprint size={20} weight="bold" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="font-display text-body font-bold">
                {hora
                  ? tf(language, "rutina.sensores.tituloHora", { hora })
                  : t(language, "rutina.checkin.titulo")}
              </p>
              {fromDevice && (
                <span className="self-start rounded-full bg-exito-suave px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-exito">
                  {t(language, "rutina.sensores.dispositivo")}
                </span>
              )}
            </div>
            {onRecapture && (
              <Button variant="secundario" size="sm" onClick={onRecapture}>
                {t(language, "rutina.checkin.repetir")}
              </Button>
            )}
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {lecturas.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-nube/70 px-2 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/50">{label}</dt>
                <dd className="mt-0.5 font-display text-body-lg font-bold tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {plan.summary.readiness && <SensorImpact readiness={plan.summary.readiness} language={language} />}

      <Card tone="tinta" className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Pulsi mood={mood} size={72} color="var(--color-fase)" />
          <div className="flex flex-col gap-1">
            <h2 className="text-h2 leading-tight font-bold">{tf(language, "rutina.carga", { n: summary.readiness ? Math.round(summary.readiness.load_multiplier * 100) : loadPercent(summary.k_load) })}</h2>
            <p className="text-small font-bold text-lavanda-texto">
              {[
                t(language, `rutina.fatiga.${summary.fatigue_level}`),
                summary.biomarkers ? tf(language, "rutina.rmssd", { n: summary.biomarkers.rmssd_hrv_ms }) : null,
                fase ? faseLabel(fase, language) : null,
                tf(language, "rutina.minutos", { n: totalMinutes(plan) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-small font-extrabold text-crema">
          <ShieldCheck size={18} weight="bold" aria-hidden="true" />
          {t(
            language,
            summary.engine_used === "gpt-6-luna"
              ? "rutina.motor.gpt6"
              : summary.engine_used === "deepseek"
                ? "rutina.motor.deepseek"
                : "rutina.motor.deterministic",
          )}
        </p>
      </Card>

      {alerts.length > 0 && (
        <section aria-labelledby="alertas" className="flex flex-col gap-2 rounded-nube bg-aviso-suave p-5 text-aviso">
          <h2 id="alertas" className="flex items-center gap-2 text-h3 font-bold">
            <Warning size={22} weight="bold" aria-hidden="true" />
            {t(language, "rutina.alertas")}
          </h2>
          <ul className="flex flex-col gap-1 text-body font-bold">
            {alerts.map((alert, i) => (
              // The backend names overall pain with its key ("OVERALL"); show it in words.
              <li key={i}>{alert.replace(/\bOVERALL\b/g, t(language, "rutina.general"))}</li>
            ))}
          </ul>
        </section>
      )}

      <details className="group rounded-nube bg-crema p-5">
        <summary className="font-display text-h3 font-bold">{t(language, "rutina.porque.titulo")}</summary>
        <ul className="mt-3 flex flex-col gap-2 text-body">
          {assessment.autonomic_status && <li>{t(language, `rutina.porque.${assessment.autonomic_status}`)}</li>}
          {assessment.articular_risk_pct != null && <li>{tf(language, "rutina.porque.riesgo", { n: Math.round(assessment.articular_risk_pct) })}</li>}
          {avoided.length > 0 && <li>{tf(language, "rutina.porque.evitados", { lista: avoided.join(", ") })}</li>}
          {fase && <li>{t(language, `hoy.consejo.${fase}`)}</li>}
          <li>{t(language, "rutina.porque.carga")}</li>
        </ul>
      </details>

      {plan.warmup.length > 0 && (
        <section aria-labelledby="calentamiento" className="flex flex-col gap-3">
          <h2 id="calentamiento" className="text-h2 font-bold">
            {t(language, "rutina.calentamiento")}
          </h2>
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial>
              {plan.warmup.map((item, index) => (
                <motion.li key={item.key} layout={!reduceMotion} {...enter(index)}>
                  <ExerciseCard item={item} number={index + 1} language={language} pregnant={fase?.startsWith("TRIMESTER")} onChange={() => setChangeKey(item.key)} onDetails={() => setDetailKey(item.key)} onUpdate={(next) => updateItem(item.key, () => next)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <section aria-labelledby="ejercicios" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="ejercicios" className="text-h2 font-bold">
            {t(language, "rutina.ejercicios")}
          </h2>
          <Badge tone="nube">{tf(language, "rutina.minutos", { n: totalMinutes(plan) })}</Badge>
        </div>
        {empty ? (
          <Card>
            <EmptyState
              mood="dormida"
              title={emptyTitle}
              description={emptyReason ? t(language, "rutina.vacia.ayuda") : undefined}
              action={
                <div className="flex flex-col items-center gap-2">
                  <Button onClick={onNew}>{t(language, "rutina.nueva")}</Button>
                  {emptyReason && emptyReason !== "NO_EXERCISES" && (
                    <ButtonLink href="/app/perfil" variant="secundario" size="sm">
                      {t(language, "rutina.revisarSintomas")}
                    </ButtonLink>
                  )}
                </div>
              }
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial>
              {plan.items.map((item, index) => (
                <motion.li key={item.key} layout={!reduceMotion} {...enter(index + plan.warmup.length)}>
                  <ExerciseCard item={item} number={index + 1} language={language} pregnant={fase?.startsWith("TRIMESTER")} onChange={() => setChangeKey(item.key)} onDetails={() => setDetailKey(item.key)} onUpdate={(next) => updateItem(item.key, () => next)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {!empty && (
        <div className="sticky bottom-24 z-10 flex flex-col gap-2 lg:bottom-6">
          <ButtonLink href="/app/entreno" size="lg" fullWidth icon={<Play size={20} weight="fill" />}>
            {t(language, "rutina.empezar")}
          </ButtonLink>
        </div>
      )}
      {!empty && (
        <Button variant="fantasma" icon={<ArrowCounterClockwise size={18} weight="bold" />} onClick={onNew} className="self-center">
          {t(language, "rutina.nueva")}
        </Button>
      )}

      <ChangeSheet
        item={changing}
        language={language}
        onClose={() => setChangeKey(null)}
        onPick={(pick) => {
          if (changing) updateItem(changing.key, (item) => swapExercise(item, pick));
          setChangeKey(null);
        }}
      />
      <DetailSheet
        item={detail}
        summary={summary}
        language={language}
        onClose={() => setDetailKey(null)}
        onVariant={(variant) => {
          if (detail) updateItem(detail.key, (item) => swapExercise(item, variant));
          setDetailKey(null);
        }}
        onRemove={() => {
          if (detail) removeItem(detail.key);
          setDetailKey(null);
        }}
      />
    </div>
  );
}
