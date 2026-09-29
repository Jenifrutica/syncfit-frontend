"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { RoutineEntry } from "@/lib/api";
import { Language, localized, t } from "@/lib/i18n";
import { Check, Dumbbell, Flame } from "@/components/icons";

interface Step {
  exercise: string;
  setType: string;
  reps: number;
  restSeconds: number;
  image?: string;
}

function flatten(entries: RoutineEntry[]): Step[] {
  const steps: Step[] = [];
  for (const entry of entries) {
    if (entry.blocked) continue;
    const sets = entry.sets ?? [];
    if (sets.length === 0) {
      steps.push({ exercise: entry.exercise_original, setType: "EFFECTIVE", reps: entry.reps_adapted, restSeconds: entry.rest_seconds ?? 60, image: entry.image_url });
      continue;
    }
    for (const set of sets) {
      steps.push({ exercise: entry.exercise_original, setType: set.type, reps: set.reps, restSeconds: set.rest_seconds, image: entry.image_url });
    }
  }
  return steps;
}

const labelFor = (type: string, language: Language) =>
  type === "WARMUP" ? t(language, "warmup") : type === "APPROXIMATION" ? t(language, "approximation") : type === "ACTIVATION" ? t(language, "activation") : t(language, "effective");

export function WorkoutRunner({ entries, language, onExit }: { entries: RoutineEntry[]; language: Language; onExit: () => void }) {
  const steps = useMemo(() => flatten(entries), [entries]);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [rest, setRest] = useState<number | null>(null);
  const [logs, setLogs] = useState<Record<number, number>>({});
  const elapsed = useRef(0);
  const [elapsedView, setElapsedView] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      elapsed.current += 1;
      setElapsedView(elapsed.current);
      setRest((r) => {
        if (r === null) return null;
        if (r <= 1) {
          setIndex((i) => Math.min(i + 1, steps.length - 1));
          return null;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [steps.length]);

  const current = steps[index];
  const done = index >= steps.length;

  const finishSet = () => {
    if (current && current.restSeconds > 0) setRest(current.restSeconds);
    else setIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-pink-700"><Dumbbell size={22} /> {t(language, "workoutTitle")}</h1>
        <button onClick={onExit} className="rounded-full bg-pink-100 px-4 py-1 text-sm text-pink-800">{t(language, "close")}</button>
      </header>

      <div className="mt-4 flex items-center gap-4 text-sm text-slate-700">
        <span className="flex items-center gap-1"><Flame size={16} className="text-pink-500" /> {mmss(elapsedView)}</span>
        <button onClick={() => setRunning((r) => !r)} className="rounded-full bg-pink-500 px-4 py-1 text-white">{running ? t(language, "pause") : t(language, "start")}</button>
      </div>

      {done ? (
        <div className="mt-8 rounded-2xl border border-pink-200 bg-white p-6 text-center">
          <Check size={32} className="mx-auto text-pink-500" />
          <p className="mt-2 text-lg font-semibold text-pink-700">{t(language, "routineComplete")}</p>
          <p className="text-sm text-slate-500">{t(language, "totalTime")} {mmss(elapsedView)}</p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-pink-400">{t(language, "step")} {index + 1}/{steps.length}</p>
          <h2 className="text-xl font-bold text-slate-800">{current.exercise}</h2>
          {current.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.image} alt={current.exercise} className="mt-2 h-40 w-full rounded-lg object-cover" />
          )}
          <p className="mt-2 text-slate-700">
            {labelFor(current.setType, language)} · {current.reps} {t(language, "repsShort")}
          </p>

          {rest !== null && running ? (
            <div className="mt-4 rounded-xl bg-pink-50 p-4 text-center">
              <p className="text-sm text-pink-700">{t(language, "rest")}</p>
              <p className="text-3xl font-bold text-pink-700">{mmss(rest)}</p>
              <button onClick={() => { setRest(null); setIndex((i) => Math.min(i + 1, steps.length - 1)); }} className="mt-2 rounded-full bg-pink-500 px-4 py-1 text-sm text-white">{t(language, "skipRest")}</button>
            </div>
          ) : (
            <div className="mt-4 flex items-end gap-3">
              <label className="text-sm text-slate-600">
                {t(language, "weightKg")}
                <input
                  type="number"
                  value={logs[index] ?? ""}
                  onChange={(e) => setLogs((l) => ({ ...l, [index]: Number(e.target.value) }))}
                  className="ml-2 w-24 rounded border border-pink-200 px-2 py-1"
                />
              </label>
              <button onClick={finishSet} disabled={!running} className="rounded-full bg-pink-500 px-5 py-2 text-white disabled:opacity-50">{t(language, "setDone")}</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default WorkoutRunner;
