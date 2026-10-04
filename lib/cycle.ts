/**
 * Turns the backend timeline + calendar into what "Today" draws:
 * ring segments, the current week strip and the countdown line.
 */

import type { CalendarDay, Timeline } from "@/lib/api";
import { GESTATION_SEGMENTS, estimateCycleSegments, isFase, runLength, type Fase } from "@/lib/fases";
import { fromISODate, toISODate } from "@/lib/dates";

export type CycleSegment = { fase: Fase; length: number };

/** Ring arcs for one cycle, using the backend's phase per cycle day when known. */
export function cycleSegments(timeline: Timeline | null | undefined, calendar: CalendarDay[]): CycleSegment[] {
  if (timeline?.modality === "GESTATIONAL") return GESTATION_SEGMENTS;
  const length = timeline?.cycle_length_days ?? 28;
  const estimate = estimateCycleSegments(length).flatMap((s) => Array<Fase>(s.length).fill(s.fase));
  const byDay = new Map<number, Fase>();
  for (const day of calendar) {
    if (day.cycle_day && isFase(day.phase)) byDay.set(day.cycle_day, day.phase);
  }
  const phases = Array.from({ length }, (_, i) => byDay.get(i + 1) ?? estimate[i] ?? "LUTEAL");
  return runLength(phases);
}

export function trimesterOfWeek(week: number): Fase {
  return week <= 13 ? "TRIMESTER_1" : week <= 27 ? "TRIMESTER_2" : "TRIMESTER_3";
}

/** The phase to paint today: timeline first, then the calendar. */
export function currentFase(timeline: Timeline | null | undefined, calendar: CalendarDay[], today: string): Fase | null {
  if (timeline?.modality === "GESTATIONAL" && timeline.week) return trimesterOfWeek(timeline.week);
  if (isFase(timeline?.phase)) return timeline.phase;
  const day = calendar.find((d) => d.date === today);
  return isFase(day?.phase) ? day.phase : null;
}

/** Monday..Sunday of the week that contains `date` (local ISO dates). */
export function weekDates(date: string): string[] {
  const d = fromISODate(date);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => toISODate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
}

/** "YYYY-MM" of every month the week touches (1 or 2). */
export function monthsOf(dates: string[]): string[] {
  return [...new Set(dates.map((d) => d.slice(0, 7)))];
}

/** Days until the next period starts (0 = could be today). */
export function daysUntilPeriod(timeline: Timeline | null | undefined): number | null {
  if (!timeline || timeline.modality === "GESTATIONAL" || !timeline.cycle_day || !timeline.cycle_length_days) return null;
  return Math.max(0, timeline.cycle_length_days - timeline.cycle_day + 1);
}

export function greetingKey(hour: number): string {
  if (hour < 12) return "hoy.saludo.manana";
  if (hour < 19) return "hoy.saludo.tarde";
  return "hoy.saludo.noche";
}
