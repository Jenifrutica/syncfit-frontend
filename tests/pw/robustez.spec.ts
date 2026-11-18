/**
 * Casos límite de la API y de la app: permisos cruzados, carreras, métodos HTTP,
 * entradas raras y opciones creadas en la base de datos.
 */
import { api, demoToken, expect, newAthlete, test, watch } from "./fixtures";

test.describe("robustez", () => {
  test("API: cuatro peticiones simultáneas con el mismo request_id dejan una sola rutina", async () => {
    const token = await newAthlete();
    const rid = `rq-pw-race-${Date.now()}`;
    const results = await Promise.all(
      Array.from({ length: 4 }, () => api(token, "POST", `/capture?muscle_groups=GLUTES&request_id=${rid}`)),
    );
    const codes = results.map((r) => r.status);
    expect(codes.filter((c) => c === 200).length).toBeGreaterThanOrEqual(1);
    expect(codes.every((c) => c === 200 || c === 409)).toBe(true);
    const status = await api<{ status: string }>(token, "GET", `/capture/${rid}`);
    expect(status.body.status).toBe("DONE");
  });

  test("API: el request_id de otra persona no se puede leer ni reutilizar", async () => {
    const a = await newAthlete();
    const b = await newAthlete();
    const rid = `rq-pw-own-${Date.now()}`;
    expect((await api(a, "POST", `/capture?muscle_groups=GLUTES&request_id=${rid}`)).status).toBe(200);
    expect((await api(b, "GET", `/capture/${rid}`)).status).toBe(404);
    expect((await api(b, "POST", `/capture?muscle_groups=GLUTES&request_id=${rid}`)).status).toBe(409);
  });

  test("API: un admin no puede borrar en bloque máquinas de otro gimnasio ni un atleta tocar admin", async () => {
    const gymToken = await demoToken("GYM_ADMIN");
    const athlete = await newAthlete();
    const gym = (await api<{ id: string }[]>(gymToken, "GET", "/gyms/mine?language=ES")).body[0];
    expect((await api(athlete, "DELETE", `/gyms/${gym.id}/machines`, { ids: ["x"] })).status).toBe(404);
    expect((await api(athlete, "DELETE", "/admin/options", { ids: ["x"] })).status).toBe(403);
    expect((await api(athlete, "DELETE", "/admin/users", { ids: ["x"], admin_password: "x" })).status).toBe(403);
    expect((await api(null, "DELETE", "/shares", { ids: ["x"] })).status).toBe(401);
  });

  test("API: borrados masivos repetidos en paralelo no dan 500", async () => {
    const token = await newAthlete();
    const tokens: string[] = [];
    for (let i = 0; i < 5; i += 1) tokens.push((await api<{ token: string }>(token, "POST", "/shares", { permissions: ["PROFILE"] })).body.token);
    const results = await Promise.all(Array.from({ length: 4 }, () => api<{ deleted: string[] }>(token, "DELETE", "/shares", { ids: tokens })));
    expect(results.every((r) => r.status === 200)).toBe(true);
    const total = results.reduce((n, r) => n + r.body.deleted.length, 0);
    expect(total).toBe(5); // each link deleted exactly once across the four calls
  });

  test("API: límites de entrada (lista vacía, más de 200 ids, nombre larguísimo)", async () => {
    const token = await newAthlete();
    expect((await api(token, "DELETE", "/profile/machines", { ids: [] })).status).toBe(422);
    expect((await api(token, "DELETE", "/profile/machines", { ids: Array.from({ length: 201 }, (_, i) => `m${i}`) })).status).toBe(422);
    expect((await api(token, "POST", "/profile/machines", { name: "x".repeat(81) })).status).toBe(422);
    expect((await api(token, "POST", "/capture?request_id=a b")).status).toBe(422);
  });

  test("opción creada en la BD aparece en la app y se puede usar en el perfil", async ({ page, signIn }) => {
    const root = await demoToken("SUPER_ADMIN");
    const value = `PW_GOAL_${Date.now().toString(36).toUpperCase()}`;
    const created = await api<{ id: string }>(root, "POST", "/admin/options", {
      category: "objective",
      value,
      labels: { en: "Playwright goal", es: "Objetivo Playwright" },
      meta: { sets: 2, reps: 15, rest_compound: 45, rest_iso: 30 },
    });
    expect(created.status).toBe(200);
    try {
      const athlete = await newAthlete();
      expect((await api(athlete, "PUT", "/profile", { objective: value })).status).toBe(200);
      expect((await api(athlete, "PUT", "/profile", { objective: "NO_EXISTE_X" })).status).toBe(422);
      await signIn(athlete);
      await page.goto("/app/nutricion/");
      // The new objective is offered and already selected (it was saved above).
      const select = page.getByLabel(/objetivo/i).first();
      await expect(select.locator("option", { hasText: "Objetivo Playwright" })).toHaveCount(1);
      await expect(select).toHaveValue(value);
    } finally {
      await api(root, "DELETE", "/admin/options", { ids: [created.body.id] });
    }
    const after = (await api<Record<string, { value: string }[]>>(null, "GET", "/options")).body.objective.map((o) => o.value);
    expect(after).not.toContain(value);
  });

  test("ningún botón de quitar/borrar usa PUT ni POST", async ({ page, signIn }) => {
    const token = await newAthlete();
    const machines = (await api<{ id: string }[]>(token, "GET", "/machines?language=ES")).body.slice(0, 1);
    await api(token, "POST", "/profile/machines?language=ES", { ids: machines.map((m) => m.id) });
    await api(token, "POST", "/shares", { label: "Borrar", permissions: ["PROFILE"] });
    await signIn(token);
    const net = watch(page);

    await page.goto("/app/gimnasios/");
    await page.locator('section[aria-labelledby="mis-maquinas"]').getByRole("button", { name: /quitar/i }).first().click();
    await page.goto("/app/perfil/");
    await page.getByRole("button", { name: /^borrar enlace$/i }).first().click();
    await page.locator("dialog[open]").getByRole("button", { name: /borrar/i }).first().click();
    await expect(page.getByText("Borrar", { exact: true })).toHaveCount(0);
    await page.waitForTimeout(800);

    const removals = net.calls.filter((c) => /machines|shares/.test(c) && !c.startsWith("GET"));
    expect(removals.length).toBeGreaterThan(0);
    for (const call of removals) expect(call.startsWith("DELETE"), call).toBe(true);
    expect(net.errors).toEqual([]);
  });

  test("roles: cada rol solo entra a su panel", async ({ browser }) => {
    for (const [role, path, expected] of [
      ["ATHLETE", "/admin/", /\/app/],
      ["ATHLETE", "/gym/", /\/app/],
      ["GYM_ADMIN", "/admin/", /\/gym/],
      ["GYM_ADMIN", "/app/", /\/gym/],
    ] as const) {
      const context = await browser.newContext();
      const token = await demoToken(role);
      await context.addInitScript((t) => window.localStorage.setItem("syncfit-token", t), token);
      const page = await context.newPage();
      await page.goto(path);
      await expect(page, `${role} → ${path}`).toHaveURL(expected);
      await context.close();
    }
  });

  test("token inválido o caducado: vuelve a /entrar sin romper", async ({ page, signIn }) => {
    await signIn("token.falso.123");
    const net = watch(page);
    await page.goto("/app/rutina/");
    await expect(page).toHaveURL(/\/entrar/);
    expect(net.errors).toEqual([]);
  });
});
