/** Macros meta + barra diaria de lo que aportan los suplementos TOMADOS hoy. */
import { api, expect, newAthlete, test } from "./fixtures";

const isoDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test.describe("macros", () => {
  test("vacía hasta marcar como tomado; suma al marcar; promedio si no hay macros propios", async ({ page, signIn }) => {
    const token = await newAthlete(); // 60 kg, 165 cm: the backend can estimate the target
    await api(token, "PUT", "/profile", { current_supplements: ["whey-protein", "creatine"] });
    await signIn(token);
    await page.goto("/app/nutricion/");
    await expect(page.getByRole("heading", { name: /macros meta/i })).toBeVisible({ timeout: 20_000 });
    const supp = page.locator("[data-macros-suplementos]");
    await expect(supp).toContainText(/macros de suplementos/i);
    await expect(supp).toContainText("0 kcal");
    await expect(supp.locator("[data-macros-vacio]")).toBeVisible();

    // Mark the whey as taken in the app.
    const whey = page.locator("li").filter({ hasText: /prote[ií]na de suero/i }).first();
    await whey.getByRole("button", { name: /marcar como tomado/i }).click();
    await expect(supp).toContainText("120 kcal"); // average whey scoop; creatine adds nothing
    await expect(supp).toContainText(/Proteína 24 g/);
    await expect(supp).toContainText(/estimado/i);
    await expect(supp.locator("[data-macros-vacio]")).toHaveCount(0);

    // Her own whey wins and is no longer an estimate.
    await api(token, "PUT", "/profile", { supplement_macros: [{ supplement_id: "whey-protein", macros: { protein_g: 30, carbs_g: 2, fat_g: 1, kcal: 140 } }] });
    await page.reload();
    await expect(supp).toContainText("140 kcal");
    await expect(supp).not.toContainText(/estimado/i);

    // Un-mark: back to empty.
    await whey.getByRole("button", { name: /tomado/i }).click();
    await expect(supp).toContainText("0 kcal");
  });

  test("es diario: lo tomado ayer no cuenta hoy", async ({ page, signIn }) => {
    const token = await newAthlete();
    await api(token, "PUT", "/profile", { current_supplements: ["whey-protein"] });
    const yesterday = await api(token, "POST", "/supplement-intakes", { supplement_id: "whey-protein", date: isoDay(-1), taken: true });
    expect(yesterday.status).toBe(200);
    await signIn(token);
    await page.goto("/app/nutricion/");
    const supp = page.locator("[data-macros-suplementos]");
    await expect(supp).toContainText("0 kcal", { timeout: 20_000 });
    await expect(page.getByText(/tomaste 0 de 1 hoy/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /marcar como tomado/i })).toBeVisible();
  });

  test("sin suplementos no aparece la barra comparativa", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/nutricion/");
    await expect(page.getByRole("heading", { name: /macros meta/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("[data-macros-suplementos]")).toHaveCount(0);
  });
});
