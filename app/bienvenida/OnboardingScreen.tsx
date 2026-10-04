"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Baby, Drop, WarningCircle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Choice } from "@/components/ui/Choice";
import { Field, Input } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/Button";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { ProgressBar } from "@/components/ui/States";
import { MonthPicker, fromISODate, toISODate } from "@/components/cycle/MonthPicker";
import { Pulsi } from "@/components/mascot/Pulsi";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { SkyShell } from "@/components/brand/SkyShell";
import { Guard } from "@/components/session/Guard";
import { updateMyProfile } from "@/lib/api";
import { DUR, EASE } from "@/lib/motion";
import { isFase, type Fase } from "@/lib/fases";
import { GOAL_OPTIONS, OBJECTIVE_OPTIONS, goalLabel, objectiveLabel, t, tf, type Language } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { inRange } from "@/lib/validation";

type Modality = "MENSTRUAL_CYCLE" | "GESTATIONAL";
type Step = "modalidad" | "fum" | "duracion" | "semana" | "cuerpo" | "objetivo" | "etapa" | "dias";

const CYCLE_STEPS: Step[] = ["modalidad", "fum", "duracion", "cuerpo", "objetivo", "etapa", "dias"];
const PREGNANCY_STEPS: Step[] = ["modalidad", "semana", "cuerpo", "objetivo", "etapa", "dias"];

type Data = {
  modality: Modality | null;
  lastPeriod: string | null;
  skippedDate: boolean;
  cycleLength: number;
  gestationWeek: number;
  height: string;
  weight: string;
  bodyFat: string;
  calories: string;
  objective: string | null;
  goalPhase: string | null;
  weeklyGoal: string;
  restDays: string;
};

const INITIAL: Data = {
  modality: null,
  lastPeriod: null,
  skippedDate: false,
  cycleLength: 28,
  gestationWeek: 12,
  height: "",
  weight: "",
  bodyFat: "",
  calories: "",
  objective: null,
  goalPhase: null,
  weeklyGoal: "4",
  restDays: "2",
};

function trimesterOf(week: number): Fase {
  return week <= 13 ? "TRIMESTER_1" : week <= 27 ? "TRIMESTER_2" : "TRIMESTER_3";
}

export function OnboardingScreen() {
  return (
    <Guard allow={["ATHLETE"]}>
      <Onboarding />
    </Guard>
  );
}

function Onboarding() {
  const router = useRouter();
  const { user, profile, language, setProfile } = useSession();
  const reduceMotion = useReducedMotion();

  const [data, setData] = useState<Data>(INITIAL);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [finishedPhase, setFinishedPhase] = useState<Fase | null>(null);

  // Onboarding is first-run only; an athlete who already has a profile goes to Today.
  useEffect(() => {
    if (profile && !finishedPhase) router.replace("/app");
  }, [profile, finishedPhase, router]);

  const steps = data.modality === "GESTATIONAL" ? PREGNANCY_STEPS : CYCLE_STEPS;
  const step = steps[index];
  const last = index === steps.length - 1;
  const update = (patch: Partial<Data>) => {
    setData((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const validate = (): string | null => {
    switch (step) {
      case "modalidad":
        return data.modality ? null : t(language, "error.elige");
      case "fum":
        return data.lastPeriod || data.skippedDate ? null : t(language, "error.fecha");
      case "cuerpo":
        if (!inRange(Number(data.height), 120, 220)) return t(language, "error.altura");
        if (!inRange(Number(data.weight), 30, 250)) return t(language, "error.peso");
        return null;
      case "objetivo":
        return data.objective ? null : t(language, "error.elige");
      case "etapa":
        return data.goalPhase ? null : t(language, "error.elige");
      default:
        return null;
    }
  };

  const go = (delta: number) => {
    setDirection(delta);
    setError(null);
    setIndex((current) => Math.min(Math.max(current + delta, 0), steps.length - 1));
  };

  const save = async () => {
    const pregnant = data.modality === "GESTATIONAL";
    const payload: Record<string, unknown> = {
      language,
      modality: data.modality,
      objective: data.objective,
      goal_phase: data.goalPhase,
      height_cm: Number(data.height),
      weight_kg: Number(data.weight),
      weekly_training_goal: Number(data.weeklyGoal),
      rest_days_allowance: Number(data.restDays),
      ...(data.bodyFat ? { body_fat_pct: Number(data.bodyFat) } : {}),
      ...(data.calories ? { daily_calories: Number(data.calories) } : {}),
      ...(pregnant
        ? { gestation_week: data.gestationWeek }
        : { cycle_length_days: data.cycleLength, ...(data.lastPeriod ? { last_period_date: data.lastPeriod } : {}) }),
    };
    setSaving(true);
    try {
      const saved = await updateMyProfile(payload);
      const phase = saved.timeline?.phase;
      setFinishedPhase(isFase(phase) ? phase : pregnant ? trimesterOf(data.gestationWeek) : "FOLLICULAR");
      setProfile(saved);
    } catch {
      setError(t(language, "error.guardarPerfil"));
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (last) void save();
    else go(1);
  };

  if (finishedPhase) {
    return <Finished phase={finishedPhase} name={user?.display_name ?? ""} language={language} onContinue={() => router.push("/app")} />;
  }

  const offset = reduceMotion ? 0 : 28;

  return (
    <div data-fase={data.modality === "GESTATIONAL" ? trimesterOf(data.gestationWeek) : undefined} className={data.modality === "GESTATIONAL" ? "bg-fase-suave" : undefined}>
      <SkyShell>
        <div className="flex items-center gap-3">
          <IconButton label={t(language, "comun.atras")} onClick={() => go(-1)} disabled={index === 0} className={index === 0 ? "invisible" : undefined}>
            <ArrowLeft size={20} weight="bold" />
          </IconButton>
          <ProgressBar value={index + 1} max={steps.length} label={tf(language, "onb.paso", { n: index + 1, total: steps.length })} className="flex-1" />
          <span className="w-16 text-right text-small font-extrabold tabular-nums">
            {index + 1}/{steps.length}
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={step}
            initial={{ opacity: 0, x: direction * offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * offset }}
            transition={{ duration: DUR.ui, ease: EASE.salida }}
            aria-labelledby={`paso-${step}`}
            className="mt-6 flex flex-1 flex-col gap-5"
          >
            <StepBody step={step} data={data} update={update} language={language} />
          </motion.section>
        </AnimatePresence>

        <div className="mt-6 flex flex-col gap-3">
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-ficha bg-peligro-suave px-4 py-3 text-small font-bold text-peligro">
              <WarningCircle size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
              {error}
            </p>
          )}
          <Button size="lg" fullWidth onClick={next} loading={saving} loadingLabel={t(language, "onb.guardando")}>
            {last ? t(language, "onb.guardar") : t(language, "comun.continuar")}
          </Button>
        </div>
      </SkyShell>
    </div>
  );
}

function Ask({ id, title, bubble, color, mood = "feliz", children }: { id: string; title: string; bubble: string; color: string; mood?: "feliz" | "alerta"; children: ReactNode }) {
  return (
    <>
      <div className="flex items-end gap-2">
        <Pulsi mood={mood} size={84} color={color} animated />
        <SpeechBubble tone="nube" className="mb-8">
          {bubble}
        </SpeechBubble>
      </div>
      <h1 id={id} className="text-h1 font-bold">
        {title}
      </h1>
      {children}
    </>
  );
}

function StepBody({ step, data, update, language }: { step: Step; data: Data; update: (patch: Partial<Data>) => void; language: Language }) {
  const id = `paso-${step}`;
  const today = toISODate(new Date());

  switch (step) {
    case "modalidad":
      return (
        <Ask id={id} title={t(language, "onb.modalidad.titulo")} bubble={t(language, "onb.modalidad.burbuja")} color="var(--color-ovulatoria)">
          <Choice
            legend={t(language, "onb.modalidad.titulo")}
            hideLegend
            value={data.modality}
            onChange={(modality) => update({ modality, objective: modality === "GESTATIONAL" ? "GESTATIONAL_HEALTH" : data.objective === "GESTATIONAL_HEALTH" ? null : data.objective })}
            options={[
              {
                value: "MENSTRUAL_CYCLE",
                label: t(language, "onb.modalidad.ciclo"),
                description: t(language, "onb.modalidad.ciclo.desc"),
                icon: (
                  <span className="grid size-12 place-items-center rounded-full bg-menstrual text-ink">
                    <Drop size={26} weight="bold" />
                  </span>
                ),
              },
              {
                value: "GESTATIONAL",
                label: t(language, "onb.modalidad.embarazo"),
                description: t(language, "onb.modalidad.embarazo.desc"),
                icon: (
                  <span className="grid size-12 place-items-center rounded-full bg-gestacion text-ink">
                    <Baby size={26} weight="bold" />
                  </span>
                ),
              },
            ]}
          />
        </Ask>
      );

    case "fum":
      return (
        <Ask id={id} title={t(language, "onb.fum.titulo")} bubble={t(language, "onb.fum.burbuja")} color="var(--color-menstrual)">
          <MonthPicker
            value={data.lastPeriod}
            onChange={(lastPeriod) => update({ lastPeriod, skippedDate: false })}
            max={today}
            language={language}
            highlightDays={5}
            labels={{ previous: t(language, "cal.anterior"), next: t(language, "cal.siguiente") }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant={data.skippedDate ? "primario" : "secundario"} size="sm" aria-pressed={data.skippedDate} onClick={() => update({ skippedDate: !data.skippedDate, lastPeriod: null })}>
              {t(language, "onb.fum.noRecuerdo")}
            </Button>
            <p aria-live="polite" className="text-small font-bold text-ink-suave">
              {data.lastPeriod
                ? tf(language, "onb.fum.elegido", {
                    fecha: new Intl.DateTimeFormat(language === "ZH" ? "zh-CN" : language.toLowerCase(), { day: "numeric", month: "long" }).format(fromISODate(data.lastPeriod)),
                  })
                : data.skippedDate
                  ? t(language, "onb.fum.omitido")
                  : ""}
            </p>
          </div>
        </Ask>
      );

    case "duracion":
      return (
        <Ask id={id} title={t(language, "onb.duracion.titulo")} bubble={t(language, "onb.duracion.burbuja")} color="var(--color-folicular)">
          <NumberStepper
            id="duracion-ciclo"
            label={t(language, "onb.duracion.titulo")}
            value={data.cycleLength}
            onChange={(cycleLength) => update({ cycleLength })}
            min={21}
            max={45}
            unit={t(language, "onb.duracion.unidad")}
            decreaseLabel={t(language, "comun.menos")}
            increaseLabel={t(language, "comun.mas")}
          />
          <p className="text-body text-ink-suave">{t(language, "onb.duracion.ayuda")}</p>
        </Ask>
      );

    case "semana":
      return (
        <Ask id={id} title={t(language, "onb.semana.titulo")} bubble={t(language, "onb.semana.burbuja")} color="var(--color-gestacion)">
          <NumberStepper
            id="semana-embarazo"
            label={t(language, "onb.semana.titulo")}
            value={data.gestationWeek}
            onChange={(gestationWeek) => update({ gestationWeek })}
            min={1}
            max={42}
            unit={t(language, "onb.semana.unidad")}
            decreaseLabel={t(language, "comun.menos")}
            increaseLabel={t(language, "comun.mas")}
          />
          <p className="text-body text-ink-suave">{t(language, "onb.semana.ayuda")}</p>
        </Ask>
      );

    case "cuerpo":
      return (
        <Ask id={id} title={t(language, "onb.cuerpo.titulo")} bubble={t(language, "onb.cuerpo.burbuja")} color="var(--color-lutea)">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t(language, "onb.altura")}>
              {(control) => <Input {...control} type="number" inputMode="numeric" min={120} max={220} value={data.height} onChange={(e) => update({ height: e.target.value })} />}
            </Field>
            <Field label={t(language, "onb.peso")}>
              {(control) => <Input {...control} type="number" inputMode="decimal" min={30} max={250} value={data.weight} onChange={(e) => update({ weight: e.target.value })} />}
            </Field>
          </div>
          <details className="group rounded-ficha bg-nube/70 px-4 py-3">
            <summary className="font-display text-body font-semibold">{t(language, "onb.extra")}</summary>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label={t(language, "onb.grasa")}>
                {(control) => <Input {...control} type="number" inputMode="decimal" min={5} max={60} value={data.bodyFat} onChange={(e) => update({ bodyFat: e.target.value })} />}
              </Field>
              <Field label={t(language, "onb.calorias")}>
                {(control) => <Input {...control} type="number" inputMode="numeric" min={800} max={6000} value={data.calories} onChange={(e) => update({ calories: e.target.value })} />}
              </Field>
            </div>
          </details>
        </Ask>
      );

    case "objetivo":
      return (
        <Ask id={id} title={t(language, "onb.objetivo.titulo")} bubble={t(language, "onb.objetivo.burbuja")} color="var(--color-ovulatoria)">
          <Choice
            legend={t(language, "onb.objetivo.titulo")}
            hideLegend
            columns={2}
            value={data.objective}
            onChange={(objective) => update({ objective })}
            options={OBJECTIVE_OPTIONS.filter((o) => data.modality === "GESTATIONAL" || o !== "GESTATIONAL_HEALTH").map((o) => ({ value: o, label: objectiveLabel(language, o) }))}
          />
        </Ask>
      );

    case "etapa":
      return (
        <Ask id={id} title={t(language, "onb.etapa.titulo")} bubble={t(language, "onb.etapa.burbuja")} color="var(--color-folicular)">
          <Choice
            legend={t(language, "onb.etapa.titulo")}
            hideLegend
            columns={2}
            value={data.goalPhase}
            onChange={(goalPhase) => update({ goalPhase })}
            options={GOAL_OPTIONS.map((g) => ({ value: g, label: goalLabel(language, g) }))}
          />
        </Ask>
      );

    case "dias":
      return (
        <Ask id={id} title={t(language, "onb.dias.titulo")} bubble={t(language, "onb.dias.burbuja")} color="var(--color-menstrual)">
          <Choice
            legend={t(language, "onb.dias.titulo")}
            hideLegend
            variant="pildoras"
            columns={7}
            value={data.weeklyGoal}
            onChange={(weeklyGoal) => update({ weeklyGoal })}
            options={["1", "2", "3", "4", "5", "6", "7"].map((n) => ({ value: n, label: n }))}
          />
          <Choice
            legend={t(language, "onb.descanso")}
            variant="pildoras"
            columns={5}
            value={data.restDays}
            onChange={(restDays) => update({ restDays })}
            options={["0", "1", "2", "3", "4"].map((n) => ({ value: n, label: n }))}
          />
        </Ask>
      );
  }
}

function Finished({ phase, name, language, onContinue }: { phase: Fase; name: string; language: Language; onContinue: () => void }) {
  return (
    <div data-fase={phase} className="bg-fase-suave">
      <SkyShell>
        <div role="status" className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Pulsi mood="feliz" size={150} wings animated />
          <h1 className="text-h1 font-bold">{tf(language, "onb.listo.titulo", { nombre: name.split(" ")[0] })}</h1>
          <p className="max-w-sm text-body-lg font-bold text-ink-suave">{t(language, "onb.listo.texto")}</p>
          <Button size="lg" onClick={onContinue}>
            {t(language, "onb.listo.boton")}
          </Button>
        </div>
      </SkyShell>
    </div>
  );
}
