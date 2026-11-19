/**
 * Crear rutina: las estaciones avanzan en orden con lo que están haciendo, el
 * porcentaje sube y la rutina no aparece antes de que pasen todas.
 */
import { SCAN_TOTAL_MS } from "../../lib/escaneo";
import { expect, newAthlete, resultHeading, startRoutine, test } from "./fixtures";

test("crear rutina: pasos realistas que no terminan antes de tiempo", async ({ page, signIn }) => {
  await signIn(await newAthlete());
  await startRoutine(page);
  const started = Date.now();

  const detalle = page.locator("[data-scan-detalle]");
  await expect(detalle).toContainText(/pulso/i);
  await expect(detalle).toContainText(/variabilidad/i, { timeout: 8_000 });

  const percent = async () => Number((await page.locator("[data-scan-avance]").textContent())?.match(/\d+/)?.[0] ?? 0);
  const early = await percent();
  await page.waitForTimeout(1500);
  expect(await percent()).toBeGreaterThan(early);

  await expect(resultHeading(page)).toBeVisible({ timeout: 40_000 });
  // The heading shows a moment after the job starts, so allow a little slack.
  expect(Date.now() - started).toBeGreaterThanOrEqual(SCAN_TOTAL_MS - 1500);
});
