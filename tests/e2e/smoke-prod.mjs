// Read-only smoke test for production. It never creates, edits or deletes data
// (the only POSTs are the demo logins, which reuse the existing demo accounts).
//
//   node tests/e2e/smoke-prod.mjs
//   E2E_BASE=... E2E_API=... node tests/e2e/smoke-prod.mjs
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE ?? "https://syncfit.jenilarper.dev";
const API = process.env.E2E_API ?? "https://api.syncfit.jenilarper.dev";
let failed = 0;
let total = 0;

function check(name, condition, detail = "") {
  total += 1;
  if (!condition) failed += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function get(path, token) {
  const response = await fetch(`${API}/api/v1${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

async function demo(role) {
  const response = await fetch(`${API}/api/v1/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return response.ok ? response.json() : null;
}

/* --- API ------------------------------------------------------------------ */

const health = await get("/health");
check("api: health", health.status === 200 && health.body?.status === "ok", JSON.stringify(health.body));
const options = await get("/options?language=ES");
for (const category of ["objective", "goal_phase", "muscle_group_isolated", "muscle_group_general", "equipment"]) {
  check(`api: /options trae ${category}`, (options.body?.[category] ?? []).length > 0);
}
check("api: /catalog", ((await get("/catalog?language=ES")).body ?? []).length > 0);
check("api: /machines", ((await get("/machines?language=ES")).body ?? []).length > 0);
check("api: /symptoms", (await get("/symptoms?language=ES")).status === 200);
const live = await get("/live");
check("api: /live responde con canal de fuerza", live.status === 200 && "force" in (live.body ?? {}), `connected=${live.body?.connected}`);
check("api: rutas protegidas piden sesión", (await get("/profile/machines")).status === 401);

const sessions = {};
for (const [role, email] of [["SUPER_ADMIN", null], ["GYM_ADMIN", "asgardcito@asgard.com"], ["ATHLETE", null]]) {
  const session = await demo(role);
  sessions[role] = session?.access_token;
  check(`demo: ${role}`, session?.user?.role === role && (!email || session.user.email === email), session?.user?.email);
}

const root = sessions.SUPER_ADMIN;
for (const path of ["/admin/users", "/admin/options", "/admin/catalog/exercise", "/admin/catalog/machine", "/admin/gyms", "/admin/gym-admins"]) {
  check(`superadmin: GET ${path}`, (await get(path, root)).status === 200);
}
const mine = await get("/gyms/mine?language=ES", sessions.GYM_ADMIN);
check("gym: Asgard con máquinas", mine.status === 200 && mine.body?.[0]?.name === "Asgard" && mine.body[0].machines.length > 0, `${mine.body?.[0]?.name} · ${mine.body?.[0]?.machines?.length}`);
for (const path of ["/profile", "/profile/machines?language=ES", "/shares", "/gyms/joined?language=ES", "/calendar?language=ES", "/stats"]) {
  check(`atleta: GET ${path}`, (await get(path, sessions.ATHLETE)).status === 200);
}

/* --- Screens -------------------------------------------------------------- */

const browser = await chromium.launch();
async function screen(path, token, expect) {
  const context = await browser.newContext({ viewport: { width: 430, height: 940 } });
  if (token) await context.addInitScript((t) => localStorage.setItem("syncfit-token", t), token);
  const page = await context.newPage();
  const errors = [];
  const bad = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("response", (r) => r.url().includes("/api/v1") && r.status() >= 500 && bad.push(`${r.status()} ${r.url()}`));
  const response = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const found = expect ? (await page.getByText(expect).count()) > 0 : true;
  check(`pantalla: ${path}`, response?.status() === 200 && found && errors.length === 0 && bad.length === 0, [errors[0], bad[0]].filter(Boolean).join(" | "));
  await context.close();
}

await screen("/entrar/", null, /acceso de prueba/i);
await screen("/admin/", root, /cuentas/i);
await screen("/gym/", sessions.GYM_ADMIN, /asgard/i);
await screen("/app/", sessions.ATHLETE, null);
await screen("/app/gimnasios/", sessions.ATHLETE, /mis máquinas/i);
await screen("/app/checkin/", sessions.ATHLETE, /prototipo/i);
await browser.close();

console.log(`\n${total - failed}/${total} checks passed`);
if (failed) process.exitCode = 1;
