"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "@phosphor-icons/react";

import { Choice } from "@/components/ui/Choice";
import { Badge } from "@/components/ui/Chip";
import { Skeleton, SkeletonGroup } from "@/components/ui/States";
import { Pulsi } from "@/components/mascot/Pulsi";
import { ExerciseThumb } from "@/components/rutina/ExerciseThumb";
import { generateRoutine, type RoutineEntry } from "@/lib/api";
import { faseLabel, type CyclePhase } from "@/lib/fases";
import { t, tf, type Language } from "@/lib/i18n";

const DIAS: { dia: number; fase: CyclePhase }[] = [
  { dia: 3, fase: "MENSTRUAL" },
  { dia: 9, fase: "FOLLICULAR" },
  { dia: 14, fase: "OVULATORY" },
  { dia: 22, fase: "LUTEAL" },
];
const BASE = 3;

type Estado = { status: "cargando" } | { status: "error" } | { status: "listo"; rutina: RoutineEntry[]; base: RoutineEntry[] };

const nombre = (e: RoutineEntry) => (e.blocked && e.exercise_substitute ? e.exercise_substitute : e.exercise_original);
const cache = new Map<string, Promise<RoutineEntry[]>>();

function rutinaDel(dia: number, language: Language): Promise<RoutineEntry[]> {
  const key = `${dia}-${language}`;
  if (!cache.has(key)) {
    const pending = generateRoutine(["LOWER_BODY"], language, { cycleDay: dia, includeWarmup: false, exercisesCount: 5 }).then((r) => r.routine);
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return cache.get(key)!;
}

/**
 * "Same routine, different phase": a live call to the deterministic engine
 * (no login, sample telemetry) for four cycle days. The section's sky takes
 * the chosen phase's color, and exercises that differ from day 3 are marked.
 */
export function DemoFases({ language }: { language: Language }) {
  const [dia, setDia] = useState(BASE);
  const [estado, setEstado] = useState<Estado>({ status: "cargando" });
  const fase = DIAS.find((d) => d.dia === dia)!.fase;

  useEffect(() => {
    let vivo = true;
    setEstado((prev) => (prev.status === "listo" ? prev : { status: "cargando" }));
    Promise.all([rutinaDel(dia, language), rutinaDel(BASE, language)])
      .then(([rutina, base]) => vivo && setEstado({ status: "listo", rutina, base }))
      .catch(() => vivo && setEstado({ status: "error" }));
    return () => {
      vivo = false;
    };
  }, [dia, language]);

  const enBase = estado.status === "listo" ? new Set(estado.base.map(nombre)) : new Set<string>();

  return (
    <div data-fase={fase} className="rounded-cielo bg-fase-suave p-5 transition-colors duration-500 sm:p-8">
      <Choice
        legend={t(language, "land.demo.titulo")}
        hideLegend
        variant="segmentado"
        value={String(dia)}
        onChange={(v) => setDia(Number(v))}
        options={DIAS.map((d) => ({
          value: String(d.dia),
          label: (
            <span className="flex flex-col items-center leading-tight sm:flex-row sm:gap-1.5">
              <span>{tf(language, "land.demo.dia", { n: d.dia })}</span>
              <span className="text-caption font-bold opacity-80 max-sm:hidden">· {faseLabel(d.fase, language)}</span>
            </span>
          ),
        }))}
      />

      <div className="mt-6 flex items-center gap-3">
        <Pulsi size={56} mood={fase === "MENSTRUAL" ? "cansada" : "feliz"} />
        <p className="font-display text-h3 font-bold">{faseLabel(fase, language)}</p>
      </div>
      <p className="mt-2 max-w-prose text-body">{t(language, `land.fase.${fase}`)}</p>

      <div aria-live="polite" className="mt-6">
        {estado.status === "cargando" && (
          <SkeletonGroup label={t(language, "land.demo.cargando")} className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-20 rounded-ficha" />
            ))}
          </SkeletonGroup>
        )}
        {estado.status === "error" && (
          <p className="rounded-ficha bg-nube p-5 font-semibold">{t(language, "land.demo.error")}</p>
        )}
        {estado.status === "listo" && (
          <ol className="flex flex-col gap-3">
            {estado.rutina.map((e, i) => {
              const cambio = dia !== BASE && !enBase.has(nombre(e));
              return (
                <li key={`${dia}-${i}`} className="flex animate-aparecer items-center gap-4 rounded-ficha bg-nube p-3 pr-4 shadow-nube" style={{ animationDelay: `${i * 60}ms` }}>
                  <ExerciseThumb name={nombre(e)} imageUrl={e.image_url} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-body-lg font-semibold leading-tight">{nombre(e)}</p>
                    <p className="text-small text-ink-suave tabular-nums">
                      {e.series_adapted} × {e.reps_adapted}
                    </p>
                  </div>
                  {cambio && (
                    <Badge tone="fase" icon={<Sparkle size={14} weight="bold" aria-hidden="true" />} className="shrink-0 max-sm:px-2">
                      <span className="max-sm:sr-only">{t(language, "land.demo.cambio")}</span>
                    </Badge>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <p className="mt-4 text-small text-ink-suave">{t(language, "land.demo.nota")}</p>
    </div>
  );
}
