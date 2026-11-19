/**
 * Background routine generation that survives navigation, reloads and lost
 * connections.
 *
 * A job gets a `requestId` before the first request and is mirrored in
 * sessionStorage. The backend stores the result under that id, so:
 * - leaving /app/rutina does not cancel anything (the job lives in the /app
 *   layout, not in the screen);
 * - after a reload the job is resumed: first `GET /capture/{id}`, and only if
 *   the server never saw it, the same POST again (never a second routine);
 * - a dropped connection keeps polling until the network is back.
 */
import { ApiError, capture, getCaptureStatus, type CaptureResult, type EnergyLevel, type Language } from "@/lib/api";
import type { Checkin } from "@/lib/checkin";

export type JobOptions = {
  groups: string[];
  exercises: number;
  minutes: number | null;
  energy: EnergyLevel;
  warmup: boolean;
};

export type RoutineJob = {
  requestId: string;
  options: JobOptions;
  sensores: Checkin | null;
  language: Language;
  date: string;
  startedAt: number;
};

export const JOB_KEY = "syncfit-rutina-job";
/** Poll interval while the server is generating or the network is down. */
export const POLL_MS = 1500;
/** Give up after this long without a result. */
export const JOB_TIMEOUT_MS = 4 * 60_000;

export function newRequestId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `rq-${random}`.slice(0, 64);
}

export function readJob(): RoutineJob | null {
  try {
    const raw = window.sessionStorage.getItem(JOB_KEY);
    return raw ? (JSON.parse(raw) as RoutineJob) : null;
  } catch {
    return null;
  }
}

export function writeJob(job: RoutineJob | null): void {
  try {
    if (job) window.sessionStorage.setItem(JOB_KEY, JSON.stringify(job));
    else window.sessionStorage.removeItem(JOB_KEY);
  } catch {
    // Storage blocked: the job still runs in memory.
  }
}

export class JobFailed extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(id);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

function post(job: RoutineJob): Promise<CaptureResult> {
  return capture(job.options.groups.join(","), {
    exercisesCount: job.options.exercises,
    timeBudgetMinutes: job.options.minutes ?? undefined,
    energy: job.options.energy,
    includeWarmup: job.options.warmup,
    language: job.language,
    requestId: job.requestId,
    sensors: job.sensores,
  });
}

const isPending = (error: unknown) => error instanceof ApiError && error.status === 409 && JSON.stringify(error.detail ?? "").includes("pending");
const isNetwork = (error: unknown) => !(error instanceof ApiError);

/**
 * Run (or resume) a job until it yields a result. `resume` starts by asking the
 * server, because the original request may still be running there.
 */
export async function runJob(job: RoutineJob, signal: AbortSignal, resume = false): Promise<CaptureResult> {
  const deadline = job.startedAt + JOB_TIMEOUT_MS;
  let askFirst = resume;
  let posts = 0;

  while (Date.now() < deadline) {
    if (signal.aborted) throw new DOMException("aborted", "AbortError");
    if (!askFirst) {
      posts += 1;
      try {
        return await post(job);
      } catch (error) {
        if (signal.aborted) throw error;
        if (!isPending(error) && !isNetwork(error)) {
          throw new JobFailed(error instanceof Error ? error.message : "capture failed", (error as ApiError).status);
        }
        // Pending elsewhere, or the answer was lost: ask for the stored result.
      }
    }
    askFirst = false;

    // Poll the stored job.
    while (Date.now() < deadline) {
      await sleep(POLL_MS, signal);
      let status;
      try {
        status = await getCaptureStatus(job.requestId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) break; // never reached the server: POST again
        if (error instanceof ApiError && error.status === 401) throw new JobFailed("session expired", 401);
        continue; // offline or flaky: keep waiting
      }
      if (status.status === "DONE") return status.result;
      if (status.status === "ERROR") throw new JobFailed(status.error ?? "generation failed", 500);
      if (status.status === "STALE") break; // worker died: POST again (server reruns it)
    }
    if (posts >= 3) throw new JobFailed("too many retries", 504);
  }
  throw new JobFailed("timeout", 504);
}
