/**
 * Panel lateral de escritorio: marca la sección actual (también con la barra
 * final del export) y tiene acceso directo a "Mis gimnasios". La barra inferior
 * del celular tiene las mismas seis secciones.
 */
import { expect, newAthlete, test } from "./fixtures";

test.describe("navegación", () => {
  test("escritorio: Hoy y Mis gimnasios se marcan en el panel", async ({ page, signIn }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(await newAthlete());
    const panel = page.locator("aside nav");

    await page.goto("/app/");
    await expect(panel.locator('[aria-current="page"]')).toHaveText("Hoy");

    await panel.getByRole("link", { name: "Mis gimnasios" }).click();
    await expect(page).toHaveURL(/\/app\/gimnasios\/?$/);
    await expect(panel.locator('[aria-current="page"]')).toHaveText("Mis gimnasios");
  });

  test("celular: la barra inferior tiene las mismas seis secciones y marca Mis gimnasios", async ({ page, signIn }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signIn(await newAthlete());
    await page.goto("/app/gimnasios/");
    const barra = page.locator("nav.bottom-0");
    await expect(barra.getByRole("link")).toHaveCount(6);
    await expect(barra.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(barra.locator('[aria-current="page"]')).toContainText("Gimnasios");

    // Every label fits at 375 px, and the header language switcher stays on one line.
    const cortadas = await barra.locator("span.truncate").evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth).length);
    expect(cortadas).toBe(0);
    const alturas = await page.locator("header [role=radiogroup] label, header fieldset label").evaluateAll((els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))]);
    expect(alturas.length).toBeLessThanOrEqual(1);
  });
});
