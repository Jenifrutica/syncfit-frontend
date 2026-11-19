/** El panel de Rutina empieza vacío (también los síntomas) y explica si salen menos ejercicios. */
import { api, expect, newAthlete, resultHeading, test } from "./fixtures";

test.describe("panel de rutina", () => {
  test("empieza vacío cada vez y exige elegir grupos y cantidad", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/rutina/");
    await expect(page.getByRole("button", { name: /escanear y crear rutina/i })).toBeVisible();
    await expect(page.locator('#grupos button[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator("#cantidad input[type=radio]:checked")).toHaveCount(0);
    await expect(page.getByRole("switch")).not.toBeChecked();

    await page.getByRole("button", { name: /escanear y crear rutina/i }).click();
    await expect(page.getByText(/elige/i).first()).toBeVisible();
    await page.getByText("Glúteos", { exact: true }).first().click();
    await page.getByRole("button", { name: /escanear y crear rutina/i }).click();
    await expect(page.locator("[data-error-cantidad]")).toContainText(/cuántos ejercicios/i);

    // Leave and come back: blank again.
    await page.getByRole("radio", { name: "6", exact: true }).check({ force: true });
    await page.goto("/app/");
    await page.goto("/app/rutina/");
    await expect(page.locator('#grupos button[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator("#cantidad input[type=radio]:checked")).toHaveCount(0);
  });

  test("los síntomas del perfil se vacían al abrir el panel", async ({ page, signIn }) => {
    const token = await newAthlete();
    const symptoms = (await api<{ id: string }[]>(token, "GET", "/symptoms?language=ES")).body.slice(0, 1).map((s) => s.id);
    await api(token, "PUT", "/profile", { symptoms, pain_levels: { OVERALL: 4 }, symptom_notes: "rodilla" });
    await signIn(token);
    await page.goto("/app/rutina/");
    await expect(page.getByText(/sin síntomas|ninguno/i).first()).toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => (await api<{ symptoms: string[]; symptom_notes: string | null }>(token, "GET", "/profile")).body.symptoms.length).toBe(0);
  });

  test("si salen menos ejercicios de los pedidos, dice por qué", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/rutina/");
    await page.getByText("Gemelos", { exact: true }).first().click();
    await page.getByRole("radio", { name: "8", exact: true }).check({ force: true });
    await page.getByRole("button", { name: /escanear y crear rutina/i }).click();
    await page.getByRole("button", { name: /^simular$/i }).click();
    await expect(resultHeading(page)).toBeVisible({ timeout: 40_000 });
    const card = page.locator("[data-shortfall]");
    await expect(card).toBeVisible();
    await expect(card).toContainText(/pediste 8 ejercicios y salieron \d/i);
    await expect(card.locator('[data-reason="FAMILIES"]')).toContainText(/no se repite/i);
  });
});
