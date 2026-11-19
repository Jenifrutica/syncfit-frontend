/**
 * Panel lateral de escritorio: marca la sección actual (también con la barra
 * final del export) y tiene acceso directo a "Mis gimnasios". La barra inferior
 * del celular conserva sus cinco secciones.
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

  test("celular: la barra inferior sigue con cinco secciones y Perfil lleva a gimnasios", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/gimnasios/");
    const barra = page.locator("nav.bottom-0");
    await expect(barra.getByRole("link")).toHaveCount(5);
    await expect(barra.locator('[aria-current="page"]')).toContainText("Perfil");

    await page.goto("/app/perfil/");
    await expect(page.getByRole("link", { name: /gimnasios/i }).last()).toBeVisible();
  });
});
