/** Macros meta + barra comparativa de lo que aportan los suplementos. */
import { api, expect, newAthlete, test } from "./fixtures";

test.describe("macros", () => {
  test("los suplementos se comparan con la meta; promedio si no hay macros propios", async ({ page, signIn }) => {
    const token = await newAthlete(); // 60 kg, 165 cm: the backend can estimate the target
    await api(token, "PUT", "/profile", { current_supplements: ["whey-protein", "creatine"] });
    await signIn(token);
    await page.goto("/app/nutricion/");
    await expect(page.getByRole("heading", { name: /macros meta/i })).toBeVisible({ timeout: 20_000 });
    const supp = page.locator("[data-macros-suplementos]");
    await expect(supp).toContainText(/macros de suplementos/i);
    await expect(supp).toContainText("120 kcal"); // average whey scoop; creatine adds nothing
    await expect(supp).toContainText(/Proteína 24 g/);
    await expect(supp).toContainText(/estimado/i);

    // Her own whey: 30 g protein, 140 kcal -> her numbers win and it is no longer an estimate.
    await api(token, "PUT", "/profile", { supplement_macros: [{ supplement_id: "whey-protein", macros: { protein_g: 30, carbs_g: 2, fat_g: 1, kcal: 140 } }] });
    await page.reload();
    await expect(supp).toContainText("140 kcal");
    await expect(supp).toContainText(/Proteína 30 g/);
    await expect(supp).not.toContainText(/estimado/i);
  });

  test("sin suplementos no aparece la barra comparativa", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/nutricion/");
    await expect(page.getByRole("heading", { name: /macros meta/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("[data-macros-suplementos]")).toHaveCount(0);
  });
});
