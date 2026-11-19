/**
 * "Seleccionar todo / Deseleccionar todo" (SeleccionMasiva) en las cuatro
 * pantallas donde se usa: mis máquinas, grupos de la rutina, síntomas del
 * perfil y ejercicios de una máquina del gimnasio.
 */
import { api, demoToken, expect, newAthlete, test } from "./fixtures";

test.describe("seleccionar todo", () => {
  test("mis máquinas: añade todo el catálogo y quitar todo pide confirmación", async ({ page, signIn }) => {
    const token = await newAthlete();
    const catalog = (await api<unknown[]>(token, "GET", "/machines?language=ES")).body;
    await signIn(token);
    await page.goto("/app/gimnasios/");
    const bloque = page.locator("section", { has: page.locator("#mis-maquinas") }).locator("[data-seleccion-masiva]");

    await bloque.locator("[data-seleccionar-todo]").click();
    await expect.poll(async () => (await api<unknown[]>(token, "GET", "/profile/machines?language=ES")).body.length).toBe(catalog.length);

    await bloque.locator("[data-quitar-todo]").click();
    await expect(page.locator("dialog[open]")).toContainText(`${catalog.length}`);
    await page.locator("[data-clear-machines-confirm]").click();
    await expect.poll(async () => (await api<unknown[]>(token, "GET", "/profile/machines?language=ES")).body.length).toBe(0);
  });

  test("rutina: elige hasta 4 grupos compatibles y los quita", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/rutina/");
    const grupos = page.locator("#grupos");
    const elegidos = grupos.locator('[aria-pressed="true"]');

    await expect(grupos.locator("[data-seleccionar-todo]")).toHaveText(/elegir hasta 4/i);
    await grupos.locator("[data-seleccionar-todo]").click();
    await expect(elegidos).not.toHaveCount(0);
    expect(await elegidos.count()).toBeLessThanOrEqual(4);

    await grupos.locator("[data-quitar-todo]").click();
    await expect(elegidos).toHaveCount(0);
  });

  test("perfil: marca todos los síntomas o ninguno", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.goto("/app/perfil/");
    const bloque = page.locator("[data-seleccion-masiva]").first();
    const tarjeta = bloque.locator("xpath=..");
    const chips = tarjeta.locator("[aria-pressed]");
    await expect(chips.first()).toBeVisible();
    const total = await chips.count();

    await bloque.locator("[data-seleccionar-todo]").click();
    await expect(tarjeta.locator('[aria-pressed="true"]')).toHaveCount(total);
    await bloque.locator("[data-quitar-todo]").click();
    await expect(tarjeta.locator('[aria-pressed="true"]')).toHaveCount(0);
  });

  test("gimnasio: la hoja de máquina vincula todos los ejercicios y los quita", async ({ page, signIn }) => {
    await signIn(await demoToken("GYM_ADMIN"));
    await page.goto("/gym/");
    await page.getByRole("button", { name: /agregar máquina/i }).first().click();
    const hoja = page.locator("dialog[open]");
    const bloque = hoja.locator("[data-seleccion-masiva]");

    await bloque.locator("[data-seleccionar-todo]").click();
    await expect(hoja.getByText(/\d+ seleccionados/)).toBeVisible();
    await bloque.locator("[data-quitar-todo]").click();
    await expect(hoja.getByText(/\d+ seleccionados/)).toHaveCount(0);
  });
});
