"use client";

import { useCallback, useEffect, useState } from "react";

import { CapturaSensores } from "@/components/captura/CapturaSensores";
import { RoutineConfig, type CaptureOptions } from "@/components/rutina/RoutineConfig";
import { RoutineResult } from "@/components/rutina/RoutineResult";
import { ScanProgress } from "@/components/rutina/ScanProgress";
import type { Checkin } from "@/lib/checkin";
import { todayISO } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { useRoutine } from "@/lib/routine-context";
import { useSession } from "@/lib/session";

type Etapa = "config" | "sensores";

/**
 * Rutina: choose → take the three sensor readings → scan (two AIs + validator)
 * → editable result → workout. The generation itself runs in the /app layout
 * (see lib/routine-context.tsx), so leaving this screen or reloading the page
 * does not lose it: coming back shows the progress or the finished routine.
 */
export function RutinaScreen() {
  const { language } = useSession();
  const { plan, setPlan, generation, generate, clearError } = useRoutine();
  const [etapa, setEtapa] = useState<Etapa>("config");
  const [options, setOptions] = useState<CaptureOptions | null>(null);
  const today = todayISO();

  const startCapture = useCallback((next: CaptureOptions) => {
    clearError();
    setOptions(next);
    setEtapa("sensores");
  }, [clearError]);

  const onSensors = useCallback(
    (values: Checkin) => {
      if (options) generate(options, values, language);
      setEtapa("config");
    },
    [options, generate, language],
  );

  // A failed generation goes back to the form (the toast explains why).
  useEffect(() => {
    if (generation.state === "error") setEtapa("config");
  }, [generation.state]);

  const newRoutine = useCallback(() => {
    setPlan(null);
    setEtapa("config");
  }, [setPlan]);

  // Re-take the readings with the same choices (kept by RoutineConfig even
  // after leaving the screen); without them, go back to the form.
  const recapture = useCallback(() => {
    let saved: CaptureOptions | null = options;
    if (!saved) {
      try {
        const raw = JSON.parse(window.localStorage.getItem("syncfit-rutina-config") ?? "null") as CaptureOptions | null;
        saved = raw?.groups?.length ? raw : null;
      } catch {
        saved = null;
      }
    }
    setOptions(saved);
    setEtapa(saved ? "sensores" : "config");
  }, [options]);

  const running = generation.state === "running";
  const view = running ? "generando" : etapa === "sensores" ? "sensores" : plan ? "resultado" : "config";

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-8 lg:pt-10">
      {view === "generando" ? (
        <ScanProgress done={running && generation.finishing} startedAt={running ? generation.job.startedAt : Date.now()} language={language} />
      ) : view === "resultado" && plan ? (
        <RoutineResult plan={plan} language={language} onNew={newRoutine} onRecapture={recapture} />
      ) : view === "sensores" ? (
        <div className="mx-auto w-full max-w-lg">
          <header className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45">Check-in</p>
            <h1 className="mt-1 font-display text-h1 font-bold leading-tight">{t(language, "checkin.titulo")}</h1>
            <p className="mt-1 text-small text-ink/65">{t(language, "checkin.sub")}</p>
          </header>
          <CapturaSensores onComplete={onSensors} onCancel={() => setEtapa("config")} />
        </div>
      ) : (
        <RoutineConfig today={today} onScan={startCapture} />
      )}
    </div>
  );
}
