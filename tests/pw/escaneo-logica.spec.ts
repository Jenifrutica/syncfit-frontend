/** Pacing of the routine scan stations (pure logic, no browser). */
import { expect, test } from "@playwright/test";

import { SCAN_STEPS, SCAN_TOTAL_MS, scanState } from "../../lib/escaneo";

test.describe("scanState", () => {
  test("empieza en la primera estación", () => {
    expect(scanState(0)).toEqual({ active: 0, step: 0, overall: 0 });
  });

  test("avanza una estación cuando se cumple su tiempo", () => {
    expect(scanState(SCAN_STEPS[0].ms).active).toBe(1);
    expect(scanState(SCAN_STEPS[0].ms + SCAN_STEPS[1].ms + 1).active).toBe(2);
  });

  test("la última estación no se cierra sola y el total no pasa de 95 %", () => {
    const late = scanState(SCAN_TOTAL_MS * 5);
    expect(late.active).toBe(SCAN_STEPS.length - 1);
    expect(late.overall).toBeLessThanOrEqual(0.95);
  });

  test("al terminar, todo queda completo", () => {
    expect(scanState(10, true)).toEqual({ active: SCAN_STEPS.length, step: 1, overall: 1 });
  });

  test("el avance total nunca retrocede", () => {
    let previous = -1;
    for (let t = 0; t <= SCAN_TOTAL_MS + 2000; t += 100) {
      const { overall } = scanState(t);
      expect(overall).toBeGreaterThanOrEqual(previous);
      previous = overall;
    }
  });
});
