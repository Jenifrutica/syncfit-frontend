"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { RoutineConfig, type CaptureOptions } from "@/components/rutina/RoutineConfig";
import { RoutineResult } from "@/components/rutina/RoutineResult";
import { ScanProgress } from "@/components/rutina/ScanProgress";
import { capture } from "@/lib/api";
import { todayISO } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { planFromCapture } from "@/lib/routine";
import { useRoutine } from "@/lib/routine-context";
import { useSession } from "@/lib/session";

/** Long enough to see the four stations; the request itself is usually faster. */
const MIN_SCAN_MS = 3600;

/** Rutina: choose → scan (two AIs + validator) → editable result → workout. */
export function RutinaScreen() {
  const { language } = useSession();
  const { plan, setPlan } = useRoutine();
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const today = todayISO();

  const scan = async (options: CaptureOptions) => {
    setScanning(true);
    setScanDone(false);
    const started = Date.now();
    try {
      const result = await capture(options.groups.join(","), {
        exercisesCount: options.exercises,
        timeBudgetMinutes: options.minutes ?? undefined,
        energy: options.energy,
        includeWarmup: options.warmup,
        language,
      });
      await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, MIN_SCAN_MS - (Date.now() - started))));
      setScanDone(true);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      setPlan(planFromCapture(result, today));
    } catch {
      toast({ tone: "error", title: t(language, "rutina.error.captura"), closeLabel: t(language, "comun.cerrar") });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-8 lg:pt-10">
      {scanning ? (
        <ScanProgress done={scanDone} language={language} />
      ) : plan ? (
        <RoutineResult plan={plan} language={language} onNew={() => setPlan(null)} />
      ) : (
        <RoutineConfig today={today} onScan={scan} />
      )}
    </div>
  );
}
