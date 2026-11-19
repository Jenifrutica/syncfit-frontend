/**
 * Nutrición en escritorio: las dos columnas arrancan sus tarjetas a la misma
 * altura, y sin peso ni calorías se explica qué falta (no un esqueleto eterno).
 */
import { api, expect, newAthlete, test } from "./fixtures";

test.describe("nutrición", () => {
  test("escritorio: sugeridos a la misma altura que el plan, con macros calculados", async ({ page, signIn }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(await newAthlete());
    await page.goto("/app/nutricion/");

    const plan = page.getByRole("heading", { name: "Tu plan" });
    const sugeridos = page.getByRole("heading", { name: "Sugeridos para ti" });
    await expect(page.locator("#sugeridos ~ ul li").first()).toBeVisible();
    const [a, b] = await Promise.all([plan.boundingBox(), sugeridos.boundingBox()]);
    expect(Math.abs((a?.y ?? 0) - (b?.y ?? 0))).toBeLessThanOrEqual(2);

    // newAthlete() sets weight 60 kg, so macros are computed; the hint must not show.
    await expect(page.locator("[data-sin-macros]")).toHaveCount(0);
  });
});

test("sin peso ni calorías: explica qué falta y enlaza a Perfil", async ({ page, signIn }) => {
  const tag = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const reg = await api<{ access_token: string }>(null, "POST", "/auth/register", {
    email: `pw-${tag}@example.com`,
    password: "secret123",
    display_name: "Sin Peso",
    document_id: String(Math.floor(1e9 + Math.random() * 8.9e9)),
  });
  const token = reg.body.access_token;
  await api(token, "PUT", "/profile", { modality: "MENSTRUAL_CYCLE", objective: "HYPERTROPHY", age: 28 });
  await signIn(token);
  await page.goto("/app/nutricion/");

  const aviso = page.locator("[data-sin-macros]");
  await expect(aviso).toBeVisible();
  await expect(aviso.getByRole("link", { name: /ir a mi perfil/i })).toHaveAttribute("href", /\/app\/perfil/);
});
