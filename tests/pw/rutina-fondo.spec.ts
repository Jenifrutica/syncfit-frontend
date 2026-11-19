/**
 * La rutina se genera en segundo plano: cambiar de pantalla, recargar, perder la
 * red o cerrar la pestaña a mitad no la pierde ni la duplica.
 */
import type { Page, Route } from "@playwright/test";

import { api, expect, latestRoutineId, newAthlete, resultHeading, startRoutine, test, watch } from "./fixtures";

const nav = (page: Page, name: RegExp) => page.getByRole("navigation", { name: /secciones/i }).last().getByRole("link", { name });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Let the request reach the server but hold the answer for `ms`. */
async function slowCapture(page: Page, ms: number) {
  await page.route("**/api/v1/capture?**", async (route: Route) => {
    const response = await route.fetch();
    await sleep(ms);
    await route.fulfill({ response }).catch(() => undefined);
  });
}

test.describe("rutina en segundo plano", () => {
  test("cambiar de pantalla no la cancela y al volver está ahí", async ({ page, signIn }) => {
    const token = await newAthlete();
    await signIn(token);
    const net = watch(page);
    await slowCapture(page, 6000);

    await startRoutine(page);
    await nav(page, /calendario/i).click();
    await expect(page).toHaveURL(/\/app\/calendario/);
    const pill = page.locator("[data-generation-pill]");
    await expect(pill).toBeVisible();

    await nav(page, /nutrici/i).click();
    await expect(pill).toBeVisible();
    await expect(page.getByText(/tu rutina está lista/i)).toBeVisible({ timeout: 30_000 });
    await expect(pill).toBeHidden();

    await nav(page, /rutina/i).click();
    await expect(resultHeading(page)).toBeVisible();
    expect(net.count("POST /api/v1/capture")).toBe(1);
    expect(net.errors).toEqual([]);
  });

  test("volver con atrás del navegador a mitad de la generación", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await slowCapture(page, 5000);
    await startRoutine(page);
    await nav(page, /perfil/i).click();
    await expect(page).toHaveURL(/\/app\/perfil/);
    await page.goBack();
    await expect(page).toHaveURL(/\/app\/rutina/);
    await expect(page.getByRole("heading", { name: /creando tu rutina/i })).toBeVisible();
    await expect(resultHeading(page)).toBeVisible({ timeout: 30_000 });
  });

  test("recargar a mitad: se recupera la misma rutina sin generar otra", async ({ page, signIn }) => {
    const token = await newAthlete();
    await signIn(token);
    let reached = false;
    // The server gets the request and generates; the page never sees the answer.
    await page.route("**/api/v1/capture?**", async (route) => {
      await route.fetch();
      reached = true;
      await sleep(60_000);
    });
    await startRoutine(page);
    await expect.poll(() => reached, { timeout: 30_000 }).toBe(true);
    const generated = await latestRoutineId(token);
    expect(generated).not.toBeNull();

    await page.unrouteAll({ behavior: "ignoreErrors" });
    const net = watch(page);
    await page.reload();
    await expect(resultHeading(page)).toBeVisible({ timeout: 30_000 });
    expect(net.count("POST /api/v1/capture")).toBe(0); // asked the server, did not regenerate
    expect(net.count("GET /api/v1/capture/")).toBeGreaterThan(0);
    expect(await latestRoutineId(token)).toBe(generated);
  });

  test("pestaña cerrada antes de enviar: al reabrir se envía una sola vez", async ({ page, signIn }) => {
    const token = await newAthlete();
    await signIn(token);
    await page.goto("/app/rutina/");
    const today = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    // The job was saved but the request never left the tab.
    await page.evaluate((date) => {
      window.sessionStorage.setItem(
        "syncfit-rutina-job",
        JSON.stringify({
          requestId: `rq-pw${Date.now()}`,
          options: { groups: ["GLUTES"], exercises: 4, minutes: null, energy: "MODERATE", warmup: false },
          sensores: null,
          language: "ES",
          date,
          startedAt: Date.now(),
        }),
      );
    }, today);
    const net = watch(page);
    await page.reload();
    await expect(resultHeading(page)).toBeVisible({ timeout: 30_000 });
    expect(net.count("POST /api/v1/capture")).toBe(1);
    expect(await latestRoutineId(token)).not.toBeNull();
  });

  test("se pierde la respuesta y se cae la red: al volver la conexión llega la rutina", async ({ page, context, signIn }) => {
    const token = await newAthlete();
    await signIn(token);
    let served = false;
    await page.route("**/api/v1/capture?**", async (route) => {
      await route.fetch(); // the server generates it...
      served = true;
      await route.abort("internetdisconnected"); // ...but the answer is lost
    });
    await startRoutine(page);
    await expect.poll(() => served, { timeout: 30_000 }).toBe(true);
    await context.setOffline(true);
    await sleep(4000);
    await expect(page.getByRole("heading", { name: /creando tu rutina/i })).toBeVisible();
    await context.setOffline(false);
    await expect(resultHeading(page)).toBeVisible({ timeout: 30_000 });
    const routines = await api<{ routine_id: string }>(token, "GET", "/routine/latest");
    expect(routines.status).toBe(200);
  });

  test("el servidor falla: aviso claro, sin spinner eterno, y se puede reintentar", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.route("**/api/v1/capture?**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"detail":"down"}' }));
    await startRoutine(page, "Cuádriceps", { expectScan: false });
    await expect(page.getByText(/tardó demasiado|no pudimos crear/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /creando tu rutina/i })).toBeHidden();
    await expect(page.getByRole("button", { name: /escanear y crear rutina/i })).toBeVisible();

    await page.unrouteAll({ behavior: "ignoreErrors" });
    // A fresh panel each time: choose again and retry.
    await startRoutine(page);
    await expect(resultHeading(page)).toBeVisible({ timeout: 40_000 });
  });

  test("la sesión caduca a mitad: no se queda colgada", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.route("**/api/v1/capture?**", (route) => route.abort("connectionreset"));
    await page.route("**/api/v1/capture/rq-**", (route) => route.fulfill({ status: 401, contentType: "application/json", body: '{"detail":"expired"}' }));
    await startRoutine(page);
    await expect(page.getByText(/no pudimos crear/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-generation-pill]")).toBeHidden();
  });

  test("cambiar de idioma mientras se genera no la rompe", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.setViewportSize({ width: 1280, height: 900 }); // the switcher lives in the desktop sidebar
    await slowCapture(page, 4000);
    await startRoutine(page);
    await page.getByRole("radio", { name: /english/i }).first().check({ force: true });
    await expect(page.getByRole("heading", { name: /building your routine/i })).toBeVisible();
    await expect(resultHeading(page)).toBeVisible({ timeout: 30_000 });
    await expect(resultHeading(page).getByRole("heading", { name: /today's routine/i })).toBeVisible();
  });

  test("la rutina terminada sobrevive a recargar y la de ayer se descarta", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await startRoutine(page);
    await expect(resultHeading(page)).toBeVisible({ timeout: 30_000 });
    await page.reload();
    await expect(resultHeading(page)).toBeVisible();

    await page.evaluate(() => {
      const plan = JSON.parse(window.sessionStorage.getItem("syncfit-rutina") ?? "{}");
      plan.date = "2000-01-01";
      window.sessionStorage.setItem("syncfit-rutina", JSON.stringify(plan));
    });
    await page.reload();
    await expect(page.getByRole("button", { name: /escanear y crear rutina/i })).toBeVisible();
    await expect(resultHeading(page)).toHaveCount(0);
  });

  test("dos pestañas generan cada una la suya sin pisarse", async ({ context, signIn }) => {
    const token = await newAthlete();
    await signIn(token);
    const a = await context.newPage();
    const b = await context.newPage();
    const netA = watch(a);
    const netB = watch(b);
    await Promise.all([startRoutine(a, "Glúteos"), startRoutine(b, "Cuádriceps")]);
    await expect(resultHeading(a)).toBeVisible({ timeout: 40_000 });
    await expect(resultHeading(b)).toBeVisible({ timeout: 40_000 });
    expect(netA.count("POST /api/v1/capture")).toBe(1);
    expect(netB.count("POST /api/v1/capture")).toBe(1);
  });
});
