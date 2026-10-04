/**
 * One shape for the routine the UI edits and trains.
 * POST /capture returns warm-up items in RoutineEntry shape
 * (exercise_original, series_adapted…) and main items in capture shape
 * (name, series, substitute…); both are normalized here.
 */

import type { CaptureResult, LocalizedText, SetPrescription } from "@/lib/api";

export type RoutineItem = {
  key: string;
  exerciseId?: string;
  name: string;
  role?: string;
  blocked: boolean;
  blockReason: string;
  substitute: string;
  series: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  imageUrl?: string;
  mediaUrl?: string | null;
  sets: SetPrescription[];
  description?: LocalizedText;
  howTo?: LocalizedText;
  tips?: LocalizedText[];
  machineId?: string;
  machineName?: LocalizedText;
  movementPattern?: string;
  compound?: boolean;
  rationale?: string;
  impact?: string;
  /** True once the athlete changed series/reps/weight (sets were rebuilt). */
  edited?: boolean;
};

export type RoutineSummary = Omit<CaptureResult, "warmup" | "routine">;

export type RoutinePlan = {
  /** Local date the routine was captured (YYYY-MM-DD); stale plans are dropped. */
  date: string;
  summary: RoutineSummary;
  warmup: RoutineItem[];
  items: RoutineItem[];
};

const str = (value: unknown) => (typeof value === "string" ? value : "");
const num = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

/** The sets that define the visible dose: working sets, or all of them for warm-ups. */
function doseSetType(sets: SetPrescription[]): SetPrescription["type"] | null {
  if (sets.some((set) => set.type === "EFFECTIVE")) return "EFFECTIVE";
  return sets[0]?.type ?? null;
}

export function normalizeItem(raw: Record<string, unknown>, key: string): RoutineItem {
  const sets = Array.isArray(raw.sets) ? (raw.sets as SetPrescription[]) : [];
  const type = doseSetType(sets);
  const doseSets = sets.filter((set) => set.type === type);
  return {
    key,
    exerciseId: str(raw.exercise_id) || undefined,
    name: str(raw.name) || str(raw.exercise_original),
    role: str(raw.role) || undefined,
    blocked: Boolean(raw.blocked),
    blockReason: str(raw.block_reason),
    substitute: str(raw.substitute) || str(raw.exercise_substitute),
    series: doseSets.length || num(raw.series ?? raw.series_adapted, 3),
    reps: doseSets[0]?.reps ?? num(raw.reps ?? raw.reps_adapted, 10),
    weightKg: doseSets[0]?.weight_kg ?? num(raw.weight_suggested_kg, 0),
    restSeconds: doseSets[0]?.rest_seconds ?? num(raw.rest_seconds, 60),
    imageUrl: str(raw.image_url) || undefined,
    mediaUrl: (raw.media_url as string | null | undefined) ?? null,
    sets,
    description: (raw.description as LocalizedText | undefined) ?? undefined,
    howTo: (raw.how_to as LocalizedText | undefined) ?? undefined,
    tips: Array.isArray(raw.tips) ? (raw.tips as LocalizedText[]) : undefined,
    machineId: str(raw.machine_id) || undefined,
    machineName: (raw.machine_name as LocalizedText | undefined) ?? undefined,
    movementPattern: str(raw.movement_pattern) || undefined,
    compound: typeof raw.compound === "boolean" ? raw.compound : undefined,
    rationale: str(raw.rationale) || undefined,
    impact: str(raw.impact) || undefined,
  };
}

export function planFromCapture(result: CaptureResult, date: string): RoutinePlan {
  const { warmup, routine, ...summary } = result;
  return {
    date,
    summary,
    warmup: warmup.map((raw, i) => normalizeItem(raw, `calentamiento-${i}`)),
    items: routine.map((raw, i) => normalizeItem(raw, `ejercicio-${i}-${String(raw.exercise_id ?? i)}`)),
  };
}

/**
 * Applies an edit of series / reps / weight. The sets that define the dose
 * (working sets, or a warm-up's own sets) are rebuilt so the workout follows
 * the edit; approximation sets are kept.
 */
export function editDose(item: RoutineItem, patch: Partial<Pick<RoutineItem, "series" | "reps" | "weightKg">>): RoutineItem {
  const next = { ...item, ...patch, edited: true };
  const type = doseSetType(item.sets) ?? "EFFECTIVE";
  const lead = item.sets.filter((set) => set.type !== type);
  const effective: SetPrescription[] = Array.from({ length: Math.max(0, next.series) }, () => ({
    type,
    reps: next.reps,
    weight_kg: next.weightKg,
    rest_seconds: next.restSeconds,
    estimated_seconds: next.reps * 3 + next.restSeconds,
  }));
  return { ...next, sets: [...lead, ...effective] };
}

/** Swaps the exercise (alternative, variant or catalog pick), keeping the dose. */
export function swapExercise(item: RoutineItem, exercise: { id: string; name: string; image_url?: string | null; description?: LocalizedText }): RoutineItem {
  return {
    ...item,
    exerciseId: exercise.id,
    name: exercise.name,
    imageUrl: exercise.image_url ?? undefined,
    mediaUrl: null,
    description: exercise.description ?? item.description,
    howTo: undefined,
    tips: undefined,
    machineId: undefined,
    machineName: undefined,
    rationale: undefined,
    blocked: false,
    blockReason: "",
    substitute: "",
  };
}

/** Minutes for the whole plan, recomputed after edits. */
export function totalMinutes(plan: RoutinePlan): number {
  const seconds = [...plan.warmup, ...plan.items]
    .filter((item) => !item.blocked)
    .flatMap((item) => (item.sets.length ? item.sets : [{ reps: item.reps, rest_seconds: item.restSeconds } as SetPrescription]))
    .reduce((sum, set) => sum + (set.estimated_seconds ?? set.reps * 3 + set.rest_seconds), 0);
  return Math.round(seconds / 60);
}

/** Catalog images are placeholders for now; treat them as missing. */
export function realImage(url: string | undefined | null): string | null {
  return url && !url.includes("placehold.co") ? url : null;
}

/** Load multiplier in plain words: 0.82 → 82. */
export function loadPercent(kLoad: number): number {
  return Math.round(kLoad * 100);
}
