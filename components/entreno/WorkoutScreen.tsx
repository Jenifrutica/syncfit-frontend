"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Pause, Play, Plus, SkipBack, SkipForward, X } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Pulsi } from "@/components/mascot/Pulsi";
import { Cloud } from "@/components/decor/Cloud";
import { getStats } from "@/lib/api";
import { currentFase } from "@/lib/cycle";
import { todayISO } from "@/lib/dates";
import { t, tf, type Language } from "@/lib/i18n";
import { useRoutine } from "@/lib/routine-context";
import { useSession } from "@/lib/session";
import { mmss, workoutSteps, type WorkoutStep } from "@/lib/workout";

type Phase = "listo" | "serie" | "descanso" | "fin";

const RING = 2 * Math.PI * 136;

/**
 * Headspace-style guided session: one set at a time, a breathing circle,
 * a rest countdown, the weight actually used, and a soft celebration.
 */
export function WorkoutScreen() {
  const { profile, language } = useSession();
  const { plan } = useRoutine();
  const steps = useMemo(() => (plan ? workoutSteps(plan) : []), [plan]);
  const fase = currentFase(profile?.timeline, [], todayISO());

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("listo");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restLeft, setRestLeft] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [logs, setLogs] = useState<Record<number, string>>({});
  const [setsDone, setSetsDone] = useState(0);

  const step: WorkoutStep | undefined = steps[index];
  const exercises = steps.length ? steps[steps.length - 1].exerciseIndex + 1 : 0;

  useEffect(() => {
    if (!running || phase === "fin" || phase === "listo") return;
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1);
      if (phase === "descanso") setRestLeft((r) => r - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  // Rest over: move to the next set.
  useEffect(() => {
    if (phase === "descanso" && restLeft <= 0) {
      setIndex((i) => Math.min(i + 1, steps.length - 1));
      setPhase("serie");
    }
  }, [phase, restLeft, steps.length]);

  if (!plan || steps.length === 0) {
    return (
      <main className="sobre-oscuro grid min-h-svh place-items-center bg-ink px-4 text-nube">
        <EmptyState
          mood="dormida"
          title={<span className="text-nube">{t(language, "entreno.sinRutina")}</span>}
          action={
            <ButtonLink href="/app/rutina" variant="secundario">
              {t(language, "entreno.irRutina")}
            </ButtonLink>
          }
        />
      </main>
    );
  }

  if (phase === "fin") return <Finished elapsed={elapsed} setsDone={setsDone} language={language} fase={fase} />;

  const current = step ?? steps[0];
  const next = steps.slice(index + 1).find((s) => s.exerciseIndex !== current.exerciseIndex);

  const finishSet = () => {
    setSetsDone((n) => n + 1);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(30);
    if (index >= steps.length - 1) {
      setRunning(false);
      setPhase("fin");
      return;
    }
    if (current.restSeconds > 0) {
      setRestTotal(current.restSeconds);
      setRestLeft(current.restSeconds);
      setPhase("descanso");
    } else {
      setIndex(index + 1);
    }
  };

  const jumpExercise = (delta: number) => {
    const target = current.exerciseIndex + delta;
    const first = steps.findIndex((s) => s.exerciseIndex === target);
    if (first >= 0) {
      setIndex(first);
      setPhase("serie");
      setRunning(true);
    }
  };

  const resting = phase === "descanso";
  const breathing = resting || current.warmup || phase === "listo";
  const status = phase === "listo" ? "" : !running ? t(language, "entreno.pausado") : resting ? t(language, "entreno.descanso") : t(language, `set.${current.setType}`);

  return (
    <main data-fase={fase ?? undefined} className="sobre-oscuro flex min-h-svh flex-col bg-ink text-nube">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-5 px-4 pt-4 pb-6">
        <header className="flex w-full items-center justify-between gap-3">
          <Link href="/app/rutina" aria-label={t(language, "entreno.salir")} className="grid size-11 place-items-center rounded-full bg-lavanda-noche text-nube">
            <X size={20} weight="bold" aria-hidden="true" />
          </Link>
          <p className="font-display text-body-lg font-semibold">{tf(language, "entreno.ejercicio", { n: current.exerciseIndex + 1, total: exercises })}</p>
          <p className="w-16 text-right font-display text-body font-semibold text-lavanda-texto tabular-nums" aria-label={`${t(language, "entreno.tiempo")} ${mmss(elapsed)}`}>
            {mmss(elapsed)}
          </p>
        </header>

        <div aria-hidden="true" className="grid w-full gap-1.5" style={{ gridTemplateColumns: `repeat(${exercises}, minmax(0, 1fr))` }}>
          {Array.from({ length: exercises }, (_, i) => (
            <span key={i} className={cx("h-1.5 rounded-full", i < current.exerciseIndex ? "bg-fase" : i === current.exerciseIndex ? "bg-fase/60" : "bg-lavanda-noche")} />
          ))}
        </div>

        <div className="relative mt-2 grid size-72 place-items-center">
          <div aria-hidden="true" className={cx("absolute inset-0 rounded-full bg-lavanda-noche", breathing && running && "animate-respirar")} />
          <div aria-hidden="true" className={cx("absolute inset-8 rounded-full bg-lavanda/70", breathing && running && "animate-respirar [animation-delay:-4s]")} />
          {resting && (
            <svg viewBox="0 0 288 288" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
              <circle cx="144" cy="144" r="136" fill="none" stroke="var(--color-fase)" strokeWidth="10" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - Math.max(0, restLeft) / Math.max(1, restTotal))} />
            </svg>
          )}
          <div className="relative flex flex-col items-center gap-1">
            <Pulsi mood={resting ? "dormida" : "feliz"} size={resting ? 88 : 118} />
            {resting && <p className="font-display text-display leading-none font-bold tabular-nums">{mmss(restLeft)}</p>}
          </div>
        </div>

        <div aria-live="polite" className="flex flex-col items-center gap-1 text-center">
          {status && <p className="text-small font-extrabold text-crema">{status}</p>}
          <h1 className="text-h1 font-bold">{current.name}</h1>
          <p className="font-display text-body-lg font-medium text-lavanda-texto tabular-nums">
            {tf(language, "entreno.serie", { n: current.setNumber, total: current.setCount })} · {tf(language, "entreno.reps", { n: current.reps })}
            {current.weightKg > 0 ? ` · ${tf(language, "rutina.kg", { n: current.weightKg })}` : ""}
          </p>
        </div>

        {phase === "serie" && (
          <label className="flex items-center gap-3 text-small font-extrabold text-lavanda-texto">
            {t(language, "entreno.peso")}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={logs[index] ?? (current.weightKg > 0 ? String(current.weightKg) : "")}
              onChange={(e) => setLogs((l) => ({ ...l, [index]: e.target.value }))}
              className="h-12 w-24 rounded-campo border-2 border-lavanda bg-lavanda-noche px-3 text-center font-display text-body-lg font-semibold text-nube tabular-nums focus-visible:border-crema"
            />
          </label>
        )}

        <div className="mt-auto flex w-full flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <IconButton label={t(language, "entreno.anterior")} variant="fantasma" className="bg-lavanda-noche text-nube" onClick={() => jumpExercise(-1)} disabled={current.exerciseIndex === 0}>
              <SkipBack size={22} weight="fill" />
            </IconButton>

            {phase === "listo" ? (
              <BigButton label={t(language, "entreno.empezar")} onClick={() => { setPhase("serie"); setRunning(true); }}>
                <Play size={36} weight="fill" />
              </BigButton>
            ) : resting ? (
              <BigButton label={t(language, "entreno.saltar")} onClick={() => setRestLeft(0)}>
                <SkipForward size={34} weight="fill" />
              </BigButton>
            ) : (
              <BigButton label={t(language, "entreno.termine")} onClick={finishSet} disabled={!running}>
                <Check size={38} weight="bold" />
              </BigButton>
            )}

            <IconButton label={t(language, "entreno.siguienteEj")} variant="fantasma" className="bg-lavanda-noche text-nube" onClick={() => jumpExercise(1)} disabled={current.exerciseIndex >= exercises - 1}>
              <SkipForward size={22} weight="fill" />
            </IconButton>
          </div>

          {phase !== "listo" && (
            <div className="flex gap-2">
              <Button variant="fantasma" size="sm" className="bg-lavanda-noche text-nube hover:bg-lavanda" icon={running ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />} onClick={() => setRunning((r) => !r)}>
                {running ? t(language, "entreno.pausar") : t(language, "entreno.seguir")}
              </Button>
              {resting && (
                <Button variant="fantasma" size="sm" className="bg-lavanda-noche text-nube hover:bg-lavanda" icon={<Plus size={16} weight="bold" />} onClick={() => { setRestLeft((r) => r + 15); setRestTotal((r) => r + 15); }}>
                  {t(language, "entreno.mas15")}
                </Button>
              )}
            </div>
          )}

          {next && (
            <div className="flex w-full items-center justify-between gap-3 rounded-ficha bg-lavanda-noche px-4 py-3">
              <div>
                <p className="text-caption font-extrabold text-crema">{t(language, "entreno.siguiente")}</p>
                <p className="font-display text-body-lg font-semibold">{next.name}</p>
              </div>
              <p className="font-display font-semibold tabular-nums">
                {next.setCount} × {next.reps}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function BigButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-24 place-items-center rounded-full bg-crema text-ink shadow-boton transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.94] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Finished({ elapsed, setsDone, language, fase }: { elapsed: number; setsDone: number; language: Language; fase: string | null }) {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    getStats()
      .then((s) => setStreak(s.streak_days))
      .catch(() => setStreak(null));
  }, []);

  return (
    <main data-fase={fase ?? undefined} className="relative grid min-h-svh place-items-center overflow-hidden bg-fase-suave px-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {[8, 26, 48, 70, 86].map((left, i) => (
          <div key={left} className="absolute bottom-[-4rem] animate-elevar motion-reduce:hidden" style={{ left: `${left}%`, animationDelay: `${i * 1.3}s` }}>
            <Cloud className="text-nube" width={70 + (i % 3) * 30} />
          </div>
        ))}
      </div>
      <div role="status" className="relative flex max-w-sm flex-col items-center gap-5 text-center">
        <Pulsi mood="feliz" size={150} wings animated />
        <h1 className="text-h1 font-bold">{t(language, "entreno.fin.titulo")}</h1>
        <p className="text-body-lg font-bold text-ink-suave">{t(language, "entreno.fin.texto")}</p>
        <dl className="grid w-full grid-cols-2 gap-3">
          <div className="rounded-ficha bg-nube p-4">
            <dt className="text-small font-extrabold text-ink-suave">{t(language, "entreno.fin.tiempo")}</dt>
            <dd className="font-display text-h2 font-bold tabular-nums">{mmss(elapsed)}</dd>
          </div>
          <div className="rounded-ficha bg-nube p-4">
            <dt className="text-small font-extrabold text-ink-suave">{t(language, "entreno.fin.series")}</dt>
            <dd className="font-display text-h2 font-bold tabular-nums">{setsDone}</dd>
          </div>
        </dl>
        {streak != null && streak > 0 && <p className="font-display text-body-lg font-semibold">{streak === 1 ? t(language, "entreno.fin.rachaUno") : tf(language, "entreno.fin.racha", { n: streak })}</p>}
        <ButtonLink href="/app" size="lg">
          {t(language, "entreno.fin.volver")}
        </ButtonLink>
      </div>
    </main>
  );
}
