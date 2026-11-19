/**
 * Aviso de servidor: aparece cuando el backend tarda (p. ej. se está
 * despertando), desaparece cuando responde, y si no se puede llegar ofrece
 * reintentar.
 */
import { expect, newAthlete, test } from "./fixtures";

test.describe("aviso de servidor", () => {
  test("backend lento: avisa que está conectando y se va al responder", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.route("**/api/v1/stats**", async (route) => {
      await new Promise((r) => setTimeout(r, 3500));
      await route.continue();
    });
    await page.goto("/app/");
    const aviso = page.locator("[data-aviso-servidor]");
    await expect(aviso).toHaveAttribute("data-aviso-servidor", "lento", { timeout: 5_000 });
    await expect(aviso).toContainText(/conectando con el servidor/i);
    await expect(aviso).toHaveCount(0, { timeout: 10_000 });
  });

  test("backend caído: lo dice claro y ofrece reintentar", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    // Server down: no API call gets through.
    await page.route("**/api/v1/**", (route) => route.abort("failed"));
    await page.goto("/app/");
    const aviso = page.locator('[data-aviso-servidor="caido"]');
    await expect(aviso).toBeVisible();
    await expect(aviso.getByRole("button", { name: /reintentar/i })).toBeVisible();
  });

  test("respuestas normales: no aparece ningún aviso", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(2500);
    await expect(page.locator("[data-aviso-servidor]")).toHaveCount(0);
  });
});
