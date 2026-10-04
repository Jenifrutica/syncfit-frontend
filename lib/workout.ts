/** Flattens today's plan into the sets the guided workout walks through. */

import type { SetPrescription } from "@/lib/api";
import type { RoutineItem, RoutinePlan } from "@/lib/routine";

export type WorkoutStep = {
  itemKey: string;
  name: string;
  exerciseIndex: number;
  setType: SetPrescription["type"];
  setNumber: number;
  setCount: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  warmup: boolean;
};

function setsOf(item: RoutineItem): SetPrescription[] {
  if (item.sets.length) return item.sets;
  return Array.from({ length: item.series }, () => ({ type: "EFFECTIVE" as const, reps: item.reps, weight_kg: item.weightKg, rest_seconds: item.restSeconds, estimated_seconds: 0 }));
}

/** Blocked exercises are skipped, as before the redesign. */
export function workoutSteps(plan: RoutinePlan): WorkoutStep[] {
  const exercises = [...plan.warmup.map((item) => ({ item, warmup: true })), ...plan.items.map((item) => ({ item, warmup: false }))].filter(({ item }) => !item.blocked);
  return exercises.flatMap(({ item, warmup }, exerciseIndex) => {
    const sets = setsOf(item);
    return sets.map((set, i) => ({
      itemKey: item.key,
      name: item.name,
      exerciseIndex,
      setType: set.type,
      setNumber: i + 1,
      setCount: sets.length,
      reps: set.reps,
      weightKg: set.weight_kg,
      restSeconds: set.rest_seconds,
      warmup,
    }));
  });
}

export function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
