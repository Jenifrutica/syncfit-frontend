/**
 * Phase metadata shared by the UI: the backend's InferredPhase values
 * (syncfit-contracts common.schema.json) mapped to labels and token names.
 * The color itself comes from CSS: put `data-fase={phase}` on an ancestor
 * and use the `bg-fase` / `bg-fase-suave` utilities.
 */

import type { Language } from "@/lib/i18n";

export const CYCLE_PHASES = ["MENSTRUAL", "FOLLICULAR", "OVULATORY", "LUTEAL"] as const;
export const TRIMESTERS = ["TRIMESTER_1", "TRIMESTER_2", "TRIMESTER_3"] as const;

export type CyclePhase = (typeof CYCLE_PHASES)[number];
export type Trimester = (typeof TRIMESTERS)[number];
export type Fase = CyclePhase | Trimester;

/** Tailwind color token name of each phase (bg-<token>, bg-<token>-suave). */
export const FASE_TOKEN: Record<Fase, string> = {
  MENSTRUAL: "menstrual",
  FOLLICULAR: "folicular",
  OVULATORY: "ovulatoria",
  LUTEAL: "lutea",
  TRIMESTER_1: "gestacion",
  TRIMESTER_2: "gestacion",
  TRIMESTER_3: "gestacion",
};

/** Hex values for SVG fills (same values as app/tokens.css). */
export const FASE_COLOR: Record<Fase, { base: string; suave: string }> = {
  MENSTRUAL: { base: "#f08a7e", suave: "#fbd1cb" },
  FOLLICULAR: { base: "#8fd3b6", suave: "#d3f1e4" },
  OVULATORY: { base: "#f7c75c", suave: "#fce6ae" },
  LUTEAL: { base: "#b9aceb", suave: "#e3dcfa" },
  TRIMESTER_1: { base: "#f6b48a", suave: "#fde1cf" },
  TRIMESTER_2: { base: "#f6b48a", suave: "#fde1cf" },
  TRIMESTER_3: { base: "#f6b48a", suave: "#fde1cf" },
};

const LABELS: Record<Language, Record<Fase, string>> = {
  ES: {
    MENSTRUAL: "Menstrual",
    FOLLICULAR: "Folicular",
    OVULATORY: "Ovulatoria",
    LUTEAL: "Lútea",
    TRIMESTER_1: "1.er trimestre",
    TRIMESTER_2: "2.º trimestre",
    TRIMESTER_3: "3.er trimestre",
  },
  EN: {
    MENSTRUAL: "Menstrual",
    FOLLICULAR: "Follicular",
    OVULATORY: "Ovulatory",
    LUTEAL: "Luteal",
    TRIMESTER_1: "1st trimester",
    TRIMESTER_2: "2nd trimester",
    TRIMESTER_3: "3rd trimester",
  },
  ZH: {
    MENSTRUAL: "月经期",
    FOLLICULAR: "卵泡期",
    OVULATORY: "排卵期",
    LUTEAL: "黄体期",
    TRIMESTER_1: "孕早期",
    TRIMESTER_2: "孕中期",
    TRIMESTER_3: "孕晚期",
  },
};

/** Collapses a per-day (or per-week) phase list into ring segments. */
export function runLength(fases: Fase[]): { fase: Fase; length: number }[] {
  const segments: { fase: Fase; length: number }[] = [];
  for (const fase of fases) {
    const last = segments[segments.length - 1];
    if (last && last.fase === fase) last.length += 1;
    else segments.push({ fase, length: 1 });
  }
  return segments;
}

/** Pregnancy by weeks: 1–13, 14–27, 28–40. */
export const GESTATION_SEGMENTS: { fase: Fase; length: number }[] = [
  { fase: "TRIMESTER_1", length: 13 },
  { fase: "TRIMESTER_2", length: 14 },
  { fase: "TRIMESTER_3", length: 13 },
];

/**
 * Rough cycle shape used only until the backend calendar arrives
 * (ovulation ≈ 14 days before the next period).
 */
export function estimateCycleSegments(cycleLength = 28): { fase: Fase; length: number }[] {
  const ovulation = Math.max(8, cycleLength - 14);
  return [
    { fase: "MENSTRUAL", length: 5 },
    { fase: "FOLLICULAR", length: ovulation - 7 },
    { fase: "OVULATORY", length: 3 },
    { fase: "LUTEAL", length: cycleLength - ovulation - 1 },
  ];
}

export function isFase(value: unknown): value is Fase {
  return typeof value === "string" && value in FASE_TOKEN;
}

export function faseLabel(fase: Fase, language: Language): string {
  return LABELS[language][fase];
}
