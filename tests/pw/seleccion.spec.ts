/**
 * Seleccionar / deseleccionar todo y borrado masivo: siempre DELETE, respeta el
 * filtro, no borra al cancelar y aguanta que otra pestaña borre antes.
 */
import { api, demoToken, expect, newAthlete, test, watch } from "./fixtures";

const stamp = () => Date.now().toString(36);
const selectAll = (scope: import("@playwright/test").Page | import("@playwright/test").Locator) => scope.locator("[data-select-all]").first();

test.describe("selección masiva", () => {
  test("gimnasio: seleccionar todo respeta el buscador y solo borra lo filtrado", async ({ page, signIn }) => {
    const token = await demoToken("GYM_ADMIN");
    const gym = (await api<{ id: string }[]>(token, "GET", "/gyms/mine?language=ES")).body[0];
    const tag = stamp();
    const ids: string[] = [];
    for (const name of [`Filtro ${tag} 1`, `Filtro ${tag} 2`, `Filtro ${tag} 3`, `Otra ${tag}`]) {
      ids.push((await api<{ id: string }>(token, "POST", `/gyms/${gym.id}/machines?language=ES`, { name })).body.id);
    }
    await signIn(token);
    const net = watch(page);
    await page.goto("/gym/");
    const search = page.getByRole("searchbox", { name: /buscar máquina por nombre/i });
    await search.fill(`Filtro ${tag}`);
    await selectAll(page).check();
    await expect(page.getByText("3 seleccionados")).toBeVisible();

    // Clearing the search must not silently add the hidden machine.
    await search.fill(`${tag}`);
    await expect(page.getByText("3 seleccionados")).toBeVisible();
    await expect(page.locator("li").filter({ hasText: `Otra ${tag}` }).locator("[data-row-check]")).not.toBeChecked();

    await page.locator("[data-bulk-delete]").first().click();
    await page.locator("dialog[open] [data-bulk-confirm]").click();
    await expect(page.locator("li").filter({ hasText: `Filtro ${tag}` })).toHaveCount(0);
    await expect(page.locator("li").filter({ hasText: `Otra ${tag}` })).toHaveCount(1);
    expect(net.calls).toContain(`DELETE /api/v1/gyms/${gym.id}/machines`);
    expect(net.calls.some((c) => c.startsWith("PUT ") || c.startsWith("PATCH "))).toBe(false);

    await api(token, "DELETE", `/gyms/${gym.id}/machines`, { ids });
  });

  test("cancelar la confirmación no borra nada; casilla indeterminada con selección parcial", async ({ page, signIn }) => {
    const token = await demoToken("GYM_ADMIN");
    const gym = (await api<{ id: string }[]>(token, "GET", "/gyms/mine?language=ES")).body[0];
    const tag = stamp();
    const ids = [
      (await api<{ id: string }>(token, "POST", `/gyms/${gym.id}/machines?language=ES`, { name: `Cancel ${tag} A` })).body.id,
      (await api<{ id: string }>(token, "POST", `/gyms/${gym.id}/machines?language=ES`, { name: `Cancel ${tag} B` })).body.id,
    ];
    await signIn(token);
    const net = watch(page);
    await page.goto("/gym/");
    await page.getByRole("searchbox", { name: /buscar máquina por nombre/i }).fill(`Cancel ${tag}`);
    await page.locator(`[data-row-check="${ids[0]}"]`).check();
    expect(await selectAll(page).evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);

    await page.locator("[data-bulk-delete]").first().click();
    await page.locator("dialog[open]").getByRole("button", { name: /cancelar/i }).click();
    await expect(page.locator("li").filter({ hasText: `Cancel ${tag}` })).toHaveCount(2);
    expect(net.calls.filter((c) => c.startsWith("DELETE"))).toEqual([]);

    await selectAll(page).check();
    await selectAll(page).uncheck();
    await expect(page.getByText("0 seleccionados")).toBeVisible();
    await expect(page.locator("[data-bulk-delete]").first()).toBeDisabled();
    await api(token, "DELETE", `/gyms/${gym.id}/machines`, { ids });
  });

  test("borrar en bloque algo que otra pestaña ya borró no rompe nada", async ({ page, signIn }) => {
    const token = await newAthlete();
    const tokens: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      tokens.push((await api<{ token: string }>(token, "POST", "/shares", { label: `Pestaña ${i}`, permissions: ["PROFILE"] })).body.token);
    }
    await signIn(token);
    const net = watch(page);
    await page.goto("/app/perfil/");
    await selectAll(page).check();
    await expect(page.getByText("3 seleccionados")).toBeVisible();

    // Meanwhile another tab deletes one of them.
    await api(token, "DELETE", `/shares/${tokens[1]}`);
    await page.locator("[data-bulk-delete]").first().click();
    await page.locator("dialog[open] [data-bulk-confirm]").click();
    await expect(page.getByText("2 eliminados")).toBeVisible();
    await expect(page.getByText(/^Pestaña \d$/)).toHaveCount(0);
    expect(net.failures).toEqual([]);
    expect((await api<unknown[]>(token, "GET", "/shares")).body).toEqual([]);
  });

  test("mis máquinas: quitar es DELETE, vuelve a 'Disponibles' y se puede volver a elegir", async ({ page, signIn }) => {
    const token = await newAthlete();
    const catalog = (await api<{ id: string; name: string }[]>(token, "GET", "/machines?language=ES")).body.slice(0, 2);
    await api(token, "POST", "/profile/machines?language=ES", { ids: catalog.map((m) => m.id) });
    await signIn(token);
    const net = watch(page);
    await page.goto("/app/gimnasios/");
    await page.getByRole("button", { name: /elegir máquinas/i }).click();
    const dialog = page.locator("dialog[open]");
    const selected = dialog.locator("section").nth(0);
    const available = dialog.locator("section").nth(1);

    await selected.getByRole("button", { name: new RegExp(`quitar ${catalog[0].name}`, "i") }).click();
    await expect(available.getByRole("button", { name: catalog[0].name, exact: true })).toBeVisible();
    expect(net.calls).toContain(`DELETE /api/v1/profile/machines/${catalog[0].id}`);

    await available.getByRole("button", { name: catalog[0].name, exact: true }).click();
    await dialog.locator("[data-add-selected]").click();
    await expect(selected.getByText(catalog[0].name)).toBeVisible();
    expect(net.calls.some((c) => c.startsWith("PUT /api/v1/profile"))).toBe(false);
  });

  test("mis máquinas: nombres raros se guardan como texto (sin inyección) y el doble clic no duplica", async ({ page, signIn }) => {
    const token = await newAthlete();
    await signIn(token);
    let dialogs = 0;
    page.on("dialog", (d) => {
      dialogs += 1;
      void d.dismiss();
    });
    await page.goto("/app/gimnasios/");
    await page.getByRole("button", { name: /elegir máquinas/i }).click();
    const dialog = page.locator("dialog[open]");
    const weird = `<img src=x onerror=alert(1)> Prensa 💪 ñandú ${stamp()}`;
    await dialog.locator("#maquina-escrita").fill(weird);
    await dialog.getByRole("button", { name: /^añadir$/i }).dblclick();
    await expect(dialog.locator("section").nth(0).getByText(weird)).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    const mine = (await api<{ name: string; custom: boolean }[]>(token, "GET", "/profile/machines?language=ES")).body.filter((m) => m.custom);
    expect(mine).toHaveLength(1);
    expect(dialogs).toBe(0);
  });

  test("superadmin: borrar cuentas en bloque pide su contraseña y no se puede elegir a sí mismo", async ({ page, signIn }) => {
    const root = await demoToken("SUPER_ADMIN");
    const tag = stamp();
    const created: string[] = [];
    for (const [i, name] of [[1, "Bulk Uno"], [2, "Bulk Dos"]] as const) {
      const made = await api<{ id: string }>(root, "POST", "/admin/gym-admins", { email: `bulk-${tag}-${i}@example.com`, password: "secret123", display_name: name });
      expect(made.status).toBe(201);
      created.push(made.body.id);
    }
    await signIn(root);
    await page.goto("/admin/");
    await page.getByRole("searchbox").first().fill(`bulk-${tag}`);
    await expect(page.getByText(`bulk-${tag}-1@example.com`)).toBeVisible();
    await selectAll(page).check();
    await expect(page.getByText("2 seleccionados")).toBeVisible();

    await page.locator("[data-bulk-delete]").first().click();
    const confirm = page.locator("dialog[open]");
    await expect(confirm.locator("[data-bulk-confirm]")).toBeDisabled(); // no password yet
    await confirm.locator("input[type=password]").fill("clave-equivocada");
    await confirm.locator("[data-bulk-confirm]").click();
    await expect(page.getByText(`bulk-${tag}-1@example.com`)).toBeVisible();
    const still = (await api<{ id: string }[]>(root, "GET", `/admin/users?search=bulk-${tag}`)).body;
    expect(still).toHaveLength(2);

    // The super admin's own row has no checkbox.
    const me = (await api<{ id: string }>(root, "GET", "/account")).body.id;
    await page.getByRole("searchbox").first().fill("");
    await expect(page.locator(`[data-row-check="${me}"]`)).toHaveCount(0);
    expect(created).toHaveLength(2); // local test accounts are left for inspection
  });
});
