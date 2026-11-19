"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { useToast } from "@/components/ui/Toast";
import type { Language } from "@/lib/api";
import type { Checkin } from "@/lib/checkin";
import { todayISO } from "@/lib/dates";
import { SCAN_TOTAL_MS } from "@/lib/escaneo";
import { t } from "@/lib/i18n";
import { planFromCapture, type RoutineItem, type RoutinePlan } from "@/lib/routine";
import { JobFailed, newRequestId, readJob, runJob, writeJob, type JobOptions, type RoutineJob } from "@/lib/routine-job";
import { useSession } from "@/lib/session";

/** Every scan station gets its full time; the request itself is usually faster. */
export const MIN_SCAN_MS = SCAN_TOTAL_MS;

export type Generation =
  | { state: "idle" }
  | { state: "running"; job: RoutineJob; finishing: boolean }
  | { state: "error"; timedOut: boolean };

type RoutineValue = {
  plan: RoutinePlan | null;
  setPlan: (plan: RoutinePlan | null) => void;
  updateItem: (key: string, update: (item: RoutineItem) => RoutineItem) => void;
  removeItem: (key: string) => void;
  generation: Generation;
  /** Start a routine in the background; ignored while one is running. */
  generate: (options: JobOptions, sensores: Checkin | null, language: Language) => void;
  clearError: () => void;
};

const RoutineContext = createContext<RoutineValue | null>(null);
const STORAGE_KEY = "syncfit-rutina";

/*
 * The generation state lives at module level, outside React: the job keeps
 * running if the provider unmounts (leaving /app, strict-mode remounts) and a
 * new provider simply subscribes to it again. `inflight` guarantees one runner
 * per request id in this page.
 */
const inflight = new Set<string>();
let generationState: Generation = { state: "idle" };
const subscribers = new Set<() => void>();
let planSink: ((plan: RoutinePlan) => void) | null = null;
let notify: ((job: RoutineJob, ok: boolean, timedOut?: boolean) => void) | null = null;

function setGenerationState(next: Generation) {
  generationState = next;
  subscribers.forEach((fn) => fn());
}
const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
const getGeneration = () => generationState;
const IDLE: Generation = { state: "idle" };
const getServerGeneration = () => IDLE;

function execute(job: RoutineJob, resume: boolean) {
  if (inflight.has(job.requestId)) return;
  inflight.add(job.requestId);
  setGenerationState({ state: "running", job, finishing: false });
  const controller = new AbortController();
  void (async () => {
    try {
      const result = await runJob(job, controller.signal, resume);
      await new Promise((r) => window.setTimeout(r, Math.max(0, MIN_SCAN_MS - (Date.now() - job.startedAt))));
      setGenerationState({ state: "running", job, finishing: true });
      await new Promise((r) => window.setTimeout(r, 500));
      const base = planFromCapture(result, job.date);
      const next = job.sensores ? { ...base, sensores: job.sensores } : base;
      persist(next); // survives even if no provider is mounted right now
      planSink?.(next);
      writeJob(null);
      setGenerationState({ state: "idle" });
      notify?.(job, true);
    } catch (error) {
      console.error("routine generation failed", error);
      writeJob(null);
      const status = error instanceof JobFailed ? error.status : undefined;
      const timedOut = status === 502 || status === 503 || status === 504;
      setGenerationState({ state: "error", timedOut });
      notify?.(job, false, timedOut);
    } finally {
      inflight.delete(job.requestId);
    }
  })();
}

function persist(plan: RoutinePlan | null) {
  try {
    if (plan) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not persisted; the plan still lives in memory.
  }
}

/**
 * Today's routine, shared by every /app screen, plus the generation job.
 * The job lives here (the /app layout), not in the Rutina screen, so changing
 * screens never cancels it; it is mirrored in sessionStorage and resumed after
 * a reload. A plan from another day is discarded.
 */
export function RoutineProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<RoutinePlan | null>(null);
  const generation = useSyncExternalStore(subscribe, getGeneration, getServerGeneration);
  const toast = useToast();
  const { language } = useSession();
  const pathname = usePathname();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const setPlan = useCallback((next: RoutinePlan | null) => {
    setPlanState(next);
    persist(next);
  }, []);

  // This provider receives the finished plan and shows the toasts.
  useEffect(() => {
    planSink = setPlanState;
    notify = (job, ok, timedOut) => {
      const close = t(job.language, "comun.cerrar");
      if (!ok) toast({ tone: "error", title: t(job.language, timedOut ? "rutina.error.timeout" : "rutina.error.captura"), closeLabel: close });
      else if (!pathRef.current?.startsWith("/app/rutina")) toast({ tone: "exito", title: t(job.language, "rutina.lista"), closeLabel: close });
    };
    return () => {
      planSink = null;
      notify = null;
    };
  }, [toast]);

  // Restore today's plan and resume an unfinished job after a reload.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as RoutinePlan) : null;
      if (stored?.date === todayISO()) setPlanState(stored);
    } catch {
      // Unreadable or blocked storage: start without a plan.
    }
    const job = readJob();
    if (job && job.date === todayISO()) execute(job, true);
    else if (job) writeJob(null);
  }, []);

  const generate = useCallback((options: JobOptions, sensores: Checkin | null, lang: Language) => {
    if (readJob() || generationState.state === "running") return; // one routine at a time
    const job: RoutineJob = { requestId: newRequestId(), options, sensores, language: lang, date: todayISO(), startedAt: Date.now() };
    writeJob(job);
    execute(job, false);
  }, []);

  const clearError = useCallback(() => {
    if (generationState.state === "error") setGenerationState({ state: "idle" });
  }, []);

  const updateItem = useCallback((key: string, update: (item: RoutineItem) => RoutineItem) => {
    setPlanState((current) => {
      if (!current) return current;
      const map = (list: RoutineItem[]) => list.map((item) => (item.key === key ? update(item) : item));
      const next = { ...current, warmup: map(current.warmup), items: map(current.items) };
      persist(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setPlanState((current) => {
      if (!current) return current;
      const next = { ...current, warmup: current.warmup.filter((i) => i.key !== key), items: current.items.filter((i) => i.key !== key) };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ plan, setPlan, updateItem, removeItem, generation, generate, clearError }),
    [plan, setPlan, updateItem, removeItem, generation, generate, clearError],
  );
  const showPill = generation.state === "running" && !pathname?.startsWith("/app/rutina");

  return (
    <RoutineContext.Provider value={value}>
      {children}
      {showPill && (
        <Link
          href="/app/rutina/"
          role="status"
          data-generation-pill
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-5 py-3 font-display text-small font-bold text-nube shadow-nube lg:bottom-8"
        >
          <span aria-hidden="true" className="mr-2 inline-block size-2 animate-pulse rounded-full bg-lutea-suave" />
          {t(language, "rutina.generandoFondo")}
        </Link>
      )}
    </RoutineContext.Provider>
  );
}

export function useRoutine(): RoutineValue {
  const value = useContext(RoutineContext);
  if (!value) throw new Error("useRoutine must be used inside <RoutineProvider>");
  return value;
}
