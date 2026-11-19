/** Cambiar ejercicio con sugerencias por nombre; series enteras. */
import { expect, newAthlete, resultHeading, startRoutine, test } from "./fixtures";

test("cambiar: escribo un ejercicio y la app lo recomienda y deja elegirlo", async ({ page, signIn }) => {
  await signIn(await newAthlete());
  await startRoutine(page);
  await expect(resultHeading(page)).toBeVisible({ timeout: 40_000 });
  await page.getByRole("button", { name: /^cambiar$/i }).first().click();
  const sheet = page.locator("dialog[open]");
  await expect(sheet.locator("[data-alternativas], [data-sin-alternativas]").first()).toBeVisible();
  await sheet.locator("#sugerir-ejercicio").fill("sentadila goblet");
  await sheet.getByRole("button", { name: /^sugerir$/i }).click();
  const options = sheet.locator("[data-sugerencias] button");
  await expect(options.first()).toBeVisible();
  await expect(sheet.locator("[data-sugerencias]")).toContainText(/goblet/i);
  await options.first().click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator("[data-routine-result]")).toContainText(/goblet/i);
});

test("series: solo enteros y al menos 1, con la recomendación de 3", async ({ page, signIn }) => {
  await signIn(await newAthlete());
  await startRoutine(page);
  await expect(resultHeading(page)).toBeVisible({ timeout: 40_000 });
  await page.getByRole("button", { name: /^editar$/i }).first().click();
  await expect(page.locator("[data-series-recomendadas]").first()).toContainText(/3 series/);
  const series = page.locator('input[data-campo="series"]').first();
  await series.fill("2.6");
  await expect(series).toHaveValue("3");
  await series.fill("0");
  await expect(series).toHaveValue("1");
});
