/** Los sensores cambian la rutina: fuerza vs. tu mejor marca, pulso y temperatura. */
import { api, expect, newAthlete, resultHeading, startRoutine, test } from "./fixtures";

async function today(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

/** Start a routine whose check-in carries these readings (as if from the prototype). */
async function routineWith(page: import("@playwright/test").Page, sensores: Record<string, unknown>) {
  await page.goto("/app/rutina/");
  const date = await today(page);
  await page.evaluate(([date, sensores]) => {
    window.sessionStorage.removeItem("syncfit-rutina");
    window.sessionStorage.setItem("syncfit-rutina-job", JSON.stringify({
      requestId: `rq-pw-sens-${Date.now()}`,
      options: { groups: ["QUADRICEPS"], exercises: 4, minutes: null, energy: "ENERGY", warmup: false },
      sensores: { ...sensores, at: new Date().toISOString() }, language: "ES", date, startedAt: Date.now(),
    }));
  }, [date, sensores] as const);
  await page.reload();
  await expect(resultHeading(page)).toBeVisible({ timeout: 40_000 });
}

test.describe("sensores en la rutina", () => {
  test("check-in simulado: la tarjeta lo explica y no cambia referencias", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await startRoutine(page);
    await expect(resultHeading(page)).toBeVisible({ timeout: 40_000 });
    const card = page.locator("[data-sensor-impact]");
    await expect(card).toBeVisible();
    await expect(card).toContainText(/datos simulados/i);
    await expect(card.locator("[data-sensor]")).toHaveCount(3);
  });

  test("fuerza más baja que tu mejor marca baja los pesos; igualarla los mantiene", async ({ page, signIn }) => {
    const token = await newAthlete();
    const first = await api<{ routine: { exercise_id: string }[] }>(token, "POST", "/capture?muscle_groups=QUADRICEPS&use_live=false");
    const loads = first.body.routine.map((e) => ({ exercise_id: e.exercise_id, weight_kg: 50 }));
    await api(token, "PUT", "/profile", { loads });
    // Reference: a 20 kg push from the device.
    await api(token, "POST", "/capture?muscle_groups=QUADRICEPS&use_live=false&hr_bpm=70&force_kg=20&temp_c=35&sensor_source=device");
    await signIn(token);

    await routineWith(page, { bpm: 70, forceKg: 15, tempC: 35, source: "device" });
    const card = page.locator("[data-sensor-impact]");
    await expect(card.locator('[data-sensor="force"]')).toContainText("15.0 kg");
    await expect(card.locator('[data-sensor="force"]')).toContainText(/mejor marca: 20.0 kg/);
    await expect(card.locator('[data-sensor="force"]')).toContainText("−25 %");
    const pct = Number(await card.locator("[data-load-percent]").getAttribute("data-load-percent"));
    expect(pct).toBeLessThan(80);

    await routineWith(page, { bpm: 70, forceKg: 20, tempC: 35, source: "device" });
    await expect(page.locator("[data-sensor-impact]")).toContainText(/mantienes tus pesos máximos/i);
  });

  test("pulso alto y temperatura alta: menos carga, una serie menos y más descanso", async ({ page, signIn }) => {
    const token = await newAthlete();
    for (const hr of [66, 68, 70]) {
      await api(token, "POST", `/capture?muscle_groups=QUADRICEPS&use_live=false&hr_bpm=${hr}&force_kg=20&temp_c=35.0&sensor_source=device`);
    }
    await signIn(token);
    await routineWith(page, { bpm: 96, forceKg: 20, tempC: 36.1, source: "device" });
    const card = page.locator("[data-sensor-impact]");
    await expect(card.locator('[data-sensor="hr"]')).toContainText("96 bpm");
    await expect(card.locator('[data-sensor="hr"]')).not.toContainText("sin cambio");
    await expect(card.locator('[data-sensor="temp"]')).not.toContainText("sin cambio");
    await expect(card.locator("[data-sensor-changes]")).toContainText(/serie menos/);
    await expect(card.locator("[data-sensor-changes]")).toContainText(/descanso/);
  });

  test("cargas: lista de una columna y el campo nunca se aplasta", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/app/perfil/");
    await page.getByRole("searchbox", { name: /buscar ejercicio/i }).fill("press");
    const rows = page.locator("[data-cargas-lista] li");
    await expect(rows.first()).toBeVisible();
    const boxes = await rows.evaluateAll((els) => els.slice(0, 6).map((el) => {
      const li = el.getBoundingClientRect(); const input = el.querySelector("input")!.getBoundingClientRect();
      return { liLeft: li.left, liRight: li.right, inLeft: input.left, inRight: input.right, inWidth: input.width };
    }));
    const lefts = new Set(boxes.map((b) => Math.round(b.liLeft)));
    expect(lefts.size).toBe(1); // one column
    for (const b of boxes) {
      expect(b.inWidth).toBeGreaterThanOrEqual(80);
      expect(b.inRight).toBeLessThanOrEqual(b.liRight);
    }
  });

  test("escritorio: 'Cerrar sesión' no se monta encima del contenido al hacer scroll", async ({ page, signIn }) => {
    await signIn(await newAthlete());
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/app/perfil/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    const box = await page.locator("header [data-logout]").boundingBox();
    expect(box === null || box.y + box.height < 0).toBe(true);
  });
});
