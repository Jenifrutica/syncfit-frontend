/**
 * Timing of the four scan stations shown while a routine is created
 * (sensor → local AI → generative AI → validator). The request is a single
 * call, so the screen paces itself on these durations; the last station stays
 * open until the answer arrives.
 */
export const SCAN_STEPS = [
  { key: "sensor", ms: 2600 },
  { key: "local", ms: 3000 },
  { key: "generativa", ms: 4000 },
  { key: "validador", ms: 1800 },
] as const;

/** Shortest visible scan: every station gets its full time. */
export const SCAN_TOTAL_MS = SCAN_STEPS.reduce((sum, step) => sum + step.ms, 0);

export type ScanState = {
  /** Index of the open station (SCAN_STEPS.length once everything is done). */
  active: number;
  /** 0..1 inside the open station. */
  step: number;
  /** 0..1 for the whole scan; caps at 0.95 until `done`. */
  overall: number;
};

/** Where the scan is after `elapsed` ms. While not done, the last station never closes. */
export function scanState(elapsed: number, done = false): ScanState {
  if (done) return { active: SCAN_STEPS.length, step: 1, overall: 1 };
  let left = Math.max(0, elapsed);
  for (let i = 0; i < SCAN_STEPS.length; i++) {
    const { ms } = SCAN_STEPS[i];
    const last = i === SCAN_STEPS.length - 1;
    if (left < ms || last) {
      const step = Math.min(left / ms, last ? 0.95 : 1);
      const before = SCAN_STEPS.slice(0, i).reduce((sum, s) => sum + s.ms, 0);
      return { active: i, step, overall: Math.min((before + step * ms) / SCAN_TOTAL_MS, 0.95) };
    }
    left -= ms;
  }
  return { active: SCAN_STEPS.length - 1, step: 0.95, overall: 0.95 };
}
