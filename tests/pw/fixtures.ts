import { expect, test as base, type Page, type Request } from "@playwright/test";

export const API = process.env.E2E_API ?? "http://localhost:8001";

type Role = "SUPER_ADMIN" | "GYM_ADMIN" | "ATHLETE";

export async function demoToken(role: Role): Promise<string> {
  const response = await fetch(`${API}/api/v1/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) throw new Error(`demo ${role}: ${response.status}`);
  return (await response.json()).access_token;
}

export async function api<T = unknown>(token: string | null, method: string, path: string, body?: unknown): Promise<{ status: number; body: T }> {
  const response = await fetch(`${API}/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: (text ? JSON.parse(text) : null) as T };
}

/** A fresh athlete (own data, no interference between tests). */
export async function newAthlete(): Promise<string> {
  const tag = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const doc = String(Math.floor(1e9 + Math.random() * 8.9e9));
  const reg = await api<{ access_token: string }>(null, "POST", "/auth/register", {
    email: `pw-${tag}@example.com`,
    password: "secret123",
    display_name: "Prueba",
    document_id: doc,
  });
  if (reg.status !== 201) throw new Error(`register ${reg.status}`);
  const token = reg.body.access_token;
  await api(token, "PUT", "/profile", { modality: "MENSTRUAL_CYCLE", objective: "HYPERTROPHY", age: 28, weight_kg: 60, height_cm: 165 });
  return token;
}

/** Records every API call (method + path) and every console error of a page. */
export function watch(page: Page) {
  const calls: string[] = [];
  const errors: string[] = [];
  const failures: string[] = [];
  page.on("request", (r: Request) => {
    if (r.url().includes("/api/v1")) calls.push(`${r.method()} ${new URL(r.url()).pathname}`);
  });
  page.on("response", (r) => {
    if (r.url().includes("/api/v1") && r.status() >= 500) failures.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/routine generation failed|Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR/.test(m.text())) errors.push(m.text());
  });
  return { calls, errors, failures, count: (prefix: string) => calls.filter((c) => c.startsWith(prefix)).length };
}

export const test = base.extend<{ signIn: (token: string) => Promise<void> }>({
  signIn: async ({ context }, use) => {
    await use(async (token: string) => {
      await context.addInitScript((t) => window.localStorage.setItem("syncfit-token", t), token);
    });
  },
});

export { expect };

/** Choose a muscle group, run the simulated check-in and leave the job running. */
export async function startRoutine(page: Page, group = "Cuádriceps", { expectScan = true } = {}) {
  await page.goto("/app/rutina/");
  await page.getByText(group, { exact: true }).first().click();
  // The panel starts blank: the number of exercises must be chosen.
  await page.getByRole("radio", { name: "5", exact: true }).check({ force: true });
  await page.getByRole("button", { name: /escanear y crear rutina/i }).click();
  await expect(page.getByText(/pon la yema en el sensor óptico/i)).toBeVisible();
  await page.getByRole("button", { name: /^simular$/i }).click();
  if (expectScan) await expect(page.getByRole("heading", { name: /creando tu rutina/i })).toBeVisible({ timeout: 30_000 });
}

/** The finished routine (the config form shares its title, so use the marker). */
export const resultHeading = (page: Page) => page.locator("[data-routine-result]");

export async function latestRoutineId(token: string): Promise<string | null> {
  const r = await api<{ routine_id: string }>(token, "GET", "/routine/latest");
  return r.status === 200 ? r.body.routine_id : null;
}
