"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CapturaSensores } from "@/components/captura/CapturaSensores";
import { useToast } from "@/components/ui/Toast";
import { RoutineConfig, type CaptureOptions } from "@/components/rutina/RoutineConfig";
import { RoutineResult } from "@/components/rutina/RoutineResult";
import { ScanProgress } from "@/components/rutina/ScanProgress";
import { ApiError, capture } from "@/lib/api";
import type { Checkin } from "@/lib/checkin";
import { todayISO } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { planFromCapture } from "@/lib/routine";
import { useRoutine } from "@/lib/routine-context";
import { useSession } from "@/lib/session";

/** Long enough to see the four stations; the request itself is usually faster. */
const MIN_SCAN_MS = 3600;

type Etapa = "config" | "sensores" | "generando";

/**
 * Rutina: choose → take the three sensor readings → scan (two AIs + validator)
 * → editable result → workout. The readings travel with the plan and are shown
 * at the top of the result.
 */
export function RutinaScreen() {
  const { language } = useSession();
  const { plan, setPlan } = useRoutine();
  const toast = useToast();
  const [etapa, setEtapa] = useState<Etapa>("config");
  const [options, setOptions] = useState<CaptureOptions | null>(null);
  const [sensores, setSensores] = useState<Checkin | null>(null);
  const [scanDone, setScanDone] = useState(false);
  const started = useRef(false);
  const today = todayISO();

  const startCapture = useCallback((next: CaptureOptions) => {
    setOptions(next);
    setSensores(null);
    setScanDone(false);
    started.current = false;
    setEtapa("sensores");
  }, []);

  const onSensors = useCallback((values: Checkin) => {
    setSensores(values);
    setEtapa("generando");
  }, []);

  useEffect(() => {
    if (etapa !== "generando" || !options || started.current) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      const begin = Date.now();
      try {
        const result = await capture(options.groups.join(","), {
          exercisesCount: options.exercises,
          timeBudgetMinutes: options.minutes ?? undefined,
          energy: options.energy,
          includeWarmup: options.warmup,
          language,
        });
        await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, MIN_SCAN_MS - (Date.now() - begin))));
        if (cancelled) return;
        setScanDone(true);
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        if (cancelled) return;

        const next = planFromCapture(result, today);
        setPlan(sensores ? { ...next, sensores } : next);
        setEtapa("config");
      } catch (error) {
        console.error("capture failed", error);
        started.current = false;
        const status = error instanceof ApiError ? error.status : undefined;
        const timedOut = status === 502 || status === 503 || status === 504;
        toast({
          tone: "error",
          title: t(language, timedOut ? "rutina.error.timeout" : "rutina.error.captura"),
          closeLabel: t(language, "comun.cerrar"),
        });
        setEtapa("config");
      }
    })();

    return () => {
      cancelled = true;
    };
    // `toast` is stable enough; re-running would restart the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, options, sensores, language, today, setPlan]);

  const newRoutine = useCallback(() => {
    setPlan(null);
    setScanDone(false);
    started.current = false;
    setEtapa("config");
  }, [setPlan]);

  const recapture = useCallback(() => {
    setScanDone(false);
    started.current = false;
    setEtapa("sensores");
  }, []);

  const view = etapa === "sensores" ? "sensores" : etapa === "generando" ? "generando" : plan ? "resultado" : "config";

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-8 lg:pt-10">
      {view === "generando" ? (
        <ScanProgress done={scanDone} language={language} />
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
