/**
 * Superadmin → Catálogos → Suplementos → Nuevo: el formulario abre (antes se
 * caía por una categoría sin etiqueta) y guarda un suplemento nuevo.
 */
import { api, demoToken, expect, test, watch } from "./fixtures";

test("superadmin: crea un suplemento nuevo desde Catálogos", async ({ page, signIn }) => {
  const token = await demoToken("SUPER_ADMIN");
  await signIn(token);
  const net = watch(page);
  await page.goto("/admin/");
  await page.getByText("Catálogos", { exact: true }).click();
  await page.getByText("Suplementos", { exact: true }).click();
  await page.getByRole("button", { name: "Nuevo", exact: true }).click();

  const form = page.locator("#catalog-item-form");
  await expect(form).toBeVisible();
  await expect(form.locator('select[name="category"] option[value="ELECTROLYTES"]')).toHaveText("Electrolitos");

  const id = `pw-suple-${Date.now().toString(36)}`;
  await form.locator('[name="id"]').fill(id);
  await form.locator('[name="name.es"]').fill("Suplemento de prueba");
  await form.locator('[name="category"]').selectOption("ELECTROLYTES");
  await form.locator('[name="dosage.es"]').fill("1 sobre");
  await form.locator('[name="safety_general"]').selectOption("SAFE");
  await form.locator('[name="safety_pregnancy"]').selectOption("CAUTION");
  await form.locator('[name="notes.es"]').fill("Prueba automática");
  for (const [key, value] of [["protein_g", "0"], ["carbs_g", "5"], ["fat_g", "0"], ["kcal", "20"]]) {
    await form.locator(`[name="${key}"]`).fill(value);
  }
  await page.locator('button[form="catalog-item-form"]').click();

  await expect(page.getByText("Cambios guardados.")).toBeVisible();
  const items = (await api<{ id: string; payload: { category: string } }[]>(token, "GET", "/admin/catalog/supplement")).body;
  expect(items.find((item) => item.id === id)?.payload.category).toBe("ELECTROLYTES");
  expect(net.errors).toEqual([]);

  await api(token, "DELETE", "/admin/catalog/supplement", { ids: [id] });
});
