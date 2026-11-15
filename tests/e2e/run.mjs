/**
 * End-to-end suite for the running app (local, with the demo accounts enabled).
 *
 *   1. start the frontend:  npm run dev -- --webpack   (:3000)
 *   2. start the backend:   ~/.config/syncfit/start-backend.sh  (:8000, DEMO_LOGIN_ENABLED=1)
 *   3. node tests/e2e/run.mjs
 *
 * Covers public screens, the three roles, CRUD (create/edit/soft delete),
 * negative cases, the share link as a guest, role guards and the HTTP methods
 * used by deletes. Console errors and unexpected API 4xx/5xx fail the run.
 */

import { chromium } from "playwright";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const API = process.env.E2E_API ?? "http://localhost:8000";
const stamp = Date.now().toString().slice(-6);

const results = [];
let failed = 0;
const browser = await chromium.launch();
const deleteMethods = [];

function check(name, condition, detail = "") {
  results.push({ name, pass: Boolean(condition), detail });
  if (!condition) failed += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function demoToken(role) {
  const response = await fetch(`${API}/api/v1/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) throw new Error(`demo ${role}: ${response.status}`);
  return (await response.json()).access_token;
}

async function contextFor(token = null) {
  const context = await browser.newContext({ viewport: { width: 430, height: 940 } });
  if (token) await context.addInitScript((t) => localStorage.setItem("syncfit-token", t), token);
  return context;
}

function watch(page) {
  const errors = [];
  const bad = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (!response.url().includes("/api/v1")) return;
    if (response.status() >= 400) {
      bad.push(`${response.status()} ${response.request().method()} ${response.url().replace(API, "")}`);
    }
  });
  page.on("request", (request) => {
    if (request.method() === "DELETE") deleteMethods.push(request.url().replace(API, ""));
  });
  return { errors, bad };
}

async function go(page, path, wait = 1200) {
  const response = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  return response?.status();
}

/* --- Public screens and validation ---------------------------------------- */

{
  const context = await contextFor();
  const page = await context.newPage();
  const net = watch(page);
  await page.setDefaultTimeout(60_000);

  const status = await go(page, "/entrar/", 800);
  check("login: carga", status === 200);
  check("login: acceso de prueba visible", (await page.getByText(/acceso de prueba/i).count()) > 0);
  check(
    "login: tres botones demo",
    (await page.getByRole("button", { name: "Superadmin", exact: true }).count()) === 1 &&
      (await page.getByRole("button", { name: "Admin", exact: true }).count()) === 1 &&
      (await page.getByRole("button", { name: "Nicolasa", exact: true }).count()) === 1,
  );

  await page.locator("#campo-correo").fill("no-existe@example.com");
  await page.locator("#campo-clave").fill("Wrong123!");
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await page.waitForTimeout(1500);
  check("login: credenciales malas muestran error", (await page.getByRole("alert").count()) > 0);
  check("login: no navega con credenciales malas", new URL(page.url()).pathname === "/entrar/");

  const forgotLink = page.getByRole("link", { name: /olvidaste tu contraseña/i });
  check("login: enlace de recuperación visible", (await forgotLink.count()) === 1);
  await go(page, "/recuperar/", 800);
  check("recuperar: pide el correo", (await page.getByLabel(/tu correo/i).count()) === 1);
  await go(page, "/recuperar/?token=token-invalido", 1200);
  check("recuperar: token inválido se explica", (await page.getByText(/no es válido|caducó/i).count()) > 0);

  await go(page, "/entrar/", 800);
  await page.getByRole("radio", { name: /crear cuenta/i }).click({ force: true });
  await page.waitForTimeout(300);
  await page.locator("#campo-nombre").fill("Prueba E2E");
  await page.locator("#campo-cedula").fill("9876543210");
  await page.locator("#campo-correo").fill(`e2e-${stamp}@example.com`);
  await page.locator("#campo-clave").fill("abc12345");
  await page.getByRole("button", { name: /crear mi cuenta/i }).click();
  await page.waitForTimeout(600);
  check("registro: contraseña débil se rechaza", (await page.getByText(/incluye mayúscula/i).count()) > 0);

  const notFound = await go(page, `/ruta-inexistente-${stamp}/`, 400);
  check(
    "404: ruta inexistente controlada",
    notFound === 404 || (await page.getByText(/404|no encontrada|not found/i).count()) > 0,
    String(notFound),
  );

  await go(page, "/compartido/", 800);
  check("compartir: sin token muestra error", (await page.getByText(/no disponible|no pudimos|enlace/i).count()) > 0);
  await go(page, "/compartido/?token=sh_invalido", 800);
  check("compartir: token inválido muestra error", (await page.getByText(/no disponible|no pudimos|enlace/i).count()) > 0);

  // The wrong-password 401 and the invalid share token 404 are deliberate.
  const consoleUnexpected = net.errors.filter((item) => !/401|404/.test(item));
  check("público: sin errores de consola", consoleUnexpected.length === 0, consoleUnexpected[0]);
  const unexpected = net.bad.filter(
    (item) =>
      !item.includes("/auth/login") &&
      !item.includes("/shared/sh_invalido") &&
      !item.includes("/auth/reset/token-invalido"),
  );
  check("público: sin 4xx/5xx inesperados", unexpected.length === 0, unexpected.join(" | "));
  await context.close();
}

/* --- Superadmin ------------------------------------------------------------ */

const superToken = await demoToken("SUPER_ADMIN");
{
  const context = await contextFor(superToken);
  const page = await context.newPage();
  const net = watch(page);
  await page.setDefaultTimeout(60_000);

  await go(page, "/admin/", 1500);
  check("superadmin: entra a /admin", new URL(page.url()).pathname === "/admin/");

  for (const tab of ["Admins de gimnasio", "Gimnasios", "Catálogos"]) {
    await page.getByRole("radio", { name: new RegExp(tab, "i") }).click({ force: true });
    await page.waitForTimeout(700);
    check(`superadmin: pestaña ${tab}`, (await page.getByText(new RegExp(tab, "i")).count()) > 0);
  }

  await page.getByRole("radio", { name: /^opciones$/i }).click({ force: true });
  await page.waitForTimeout(600);
  const optionValue = `E2E_OPT_${stamp}`;
  await page.getByRole("button", { name: /nueva opción/i }).click();
  await page.waitForTimeout(400);
  let dialog = page.locator("dialog[open]");
  await dialog.getByLabel(/valor/i).fill(optionValue);
  await dialog.getByLabel(/^inglés$/i).fill("E2E option");
  await dialog.getByLabel(/^español$/i).fill("Opción E2E");
  await dialog.getByLabel(/^chino$/i).fill("E2E");
  await dialog.getByRole("button", { name: /^guardar$/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("searchbox").fill(optionValue);
  await page.waitForTimeout(600);
  check("catálogo: opción creada", (await page.getByText(optionValue).count()) > 0);

  let row = page.locator("div").filter({ hasText: optionValue }).filter({ has: page.getByTitle(/editar/i) }).first();
  await row.getByTitle(/editar/i).click();
  await page.waitForTimeout(400);
  dialog = page.locator("dialog[open]");
  await dialog.getByLabel(/^español$/i).fill("Opción E2E editada");
  await dialog.getByRole("button", { name: /^guardar$/i }).click();
  await page.waitForTimeout(900);
  check("catálogo: opción editada", (await page.getByText(/opción e2e editada/i).count()) > 0);

  const beforeOptionDelete = deleteMethods.length;
  row = page.locator("div").filter({ hasText: optionValue }).filter({ has: page.getByTitle(/desactivar/i) }).first();
  await row.getByTitle(/desactivar/i).click();
  await page.waitForTimeout(800);
  check(
    "catálogo: desactivar opción usa DELETE",
    deleteMethods.slice(beforeOptionDelete).some((url) => url.includes("/admin/options/")),
    deleteMethods.slice(beforeOptionDelete).join(" | "),
  );

  row = page.locator("div").filter({ hasText: optionValue }).filter({ has: page.getByTitle(/activar/i) }).first();
  await row.getByTitle(/activar/i).click();
  await page.waitForTimeout(700);
  check("catálogo: opción reactivada", (await page.getByText(/^activo$/i).count()) > 0);

  // Exercises: invalid JSON, create, soft delete.
  await page.getByRole("radio", { name: /^ejercicios$/i }).click({ force: true });
  await page.waitForTimeout(700);
  await page.getByRole("searchbox").fill("");
  await page.getByRole("button", { name: /^nuevo$/i }).click();
  await page.waitForTimeout(300);
  dialog = page.locator("dialog[open]");
  await dialog.locator("textarea").fill("{");
  await dialog.getByRole("button", { name: /^guardar$/i }).click();
  await page.waitForTimeout(500);
  check("catálogo: JSON inválido se rechaza", (await page.getByText(/json no es válido/i).count()) > 0);

  const exercise = {
    id: `e2e-test-${stamp}`,
    name: { en: "E2E test squat", es: "Sentadilla E2E", zh: "E2E" },
    muscle_groups: ["QUADRICEPS"],
    equipment: "machine",
    impact: "LOW",
    description: { en: "Test", es: "Prueba", zh: "测试" },
    image_url: "https://placehold.co/600x400",
    role: "MAIN",
    compound: true,
    movement_pattern: "squat",
    required_equipment: ["machine"],
  };
  await dialog.locator("textarea").fill(JSON.stringify(exercise, null, 2));
  await dialog.getByRole("button", { name: /^guardar$/i }).click();
  await page.waitForTimeout(1200);
  check("catálogo: ejercicio creado", (await page.getByText(/sentadilla e2e/i).count()) > 0);

  await page.getByRole("searchbox").fill(exercise.id);
  await page.waitForTimeout(600);
  row = page.locator("div").filter({ hasText: exercise.id }).filter({ has: page.getByTitle(/desactivar/i) }).first();
  const beforeExerciseDelete = deleteMethods.length;
  await row.getByTitle(/desactivar/i).click();
  await page.waitForTimeout(800);
  check(
    "catálogo: desactivar ejercicio usa DELETE",
    deleteMethods.slice(beforeExerciseDelete).some((url) => url.includes("/admin/catalog/exercise/")),
    deleteMethods.slice(beforeExerciseDelete).join(" | "),
  );

  check("superadmin: sin errores de consola", net.errors.length === 0, net.errors[0]);
  check("superadmin: sin 4xx/5xx inesperados", net.bad.length === 0, net.bad.join(" | "));
  await context.close();
}

/* --- Gym admin ------------------------------------------------------------- */

const gymToken = await demoToken("GYM_ADMIN");
{
  const context = await contextFor(gymToken);
  const page = await context.newPage();
  const net = watch(page);
  await page.setDefaultTimeout(60_000);

  await go(page, "/gym/", 1500);
  check("gym: entra a /gym", new URL(page.url()).pathname.startsWith("/gym"));
  check("gym: ve su gimnasio", (await page.getByText(/valhalla/i).count()) > 0);

  const machineName = `E2E Machine ${stamp}`;
  await page.getByRole("button", { name: /agregar máquina/i }).first().click();
  await page.waitForTimeout(500);
  const sheet = page.locator("dialog[open]");
  await sheet.locator("#maquina-nombre").fill(machineName);
  await sheet.getByRole("button", { name: /guardar máquina/i }).click();
  await page.waitForTimeout(1200);
  check("gym: máquina creada", (await page.getByText(machineName).count()) > 0);

  const card = page.locator("li").filter({ hasText: machineName }).first();
  await card.getByRole("button", { name: /^editar$/i }).click();
  await page.waitForTimeout(500);
  const editSheet = page.locator("dialog[open]");
  await editSheet.locator("#maquina-nombre").fill(`${machineName} editada`);
  await editSheet.getByRole("button", { name: /guardar máquina/i }).click();
  await page.waitForTimeout(1000);
  check("gym: máquina editada", (await page.getByText(`${machineName} editada`).count()) > 0);

  const editedCard = page.locator("li").filter({ hasText: `${machineName} editada` }).first();
  const beforeDelete = deleteMethods.length;
  await editedCard.getByTitle(/borrar máquina/i).click();
  await page.waitForTimeout(400);
  const confirm = page.locator("dialog[open]");
  await confirm.getByRole("button", { name: /^borrar máquina$/i }).click();
  await page.waitForTimeout(1000);
  check("gym: máquina eliminada", (await page.getByText(`${machineName} editada`).count()) === 0);
  check(
    "gym: eliminar máquina usa DELETE",
    deleteMethods.slice(beforeDelete).some((url) => url.includes("/machines/")),
    deleteMethods.slice(beforeDelete).join(" | "),
  );

  check("gym: sin errores de consola", net.errors.length === 0, net.errors[0]);
  check("gym: sin 4xx/5xx inesperados", net.bad.length === 0, net.bad.join(" | "));
  await context.close();
}

/* --- Athlete --------------------------------------------------------------- */

const athleteToken = await demoToken("ATHLETE");
{
  const context = await contextFor(athleteToken);
  const page = await context.newPage();
  const net = watch(page);
  await page.setDefaultTimeout(90_000);

  await go(page, "/app/", 1500);
  check("atleta: entra a /app", new URL(page.url()).pathname.startsWith("/app"));
  check("atleta: saluda a Nicolasa", (await page.getByText(/nicolasa/i).count()) > 0);

  for (const [path, marker] of [
    ["/app/calendario/", /calendario/i],
    ["/app/nutricion/", /nutrici|suplemento/i],
    ["/app/perfil/", /perfil|cuenta/i],
    ["/app/gimnasios/", /gimnasio|máquina/i],
  ]) {
    const pageStatus = await go(page, path, 1200);
    check(`atleta: ${path} carga`, pageStatus === 200 && (await page.getByText(marker).count()) > 0);
  }

  await go(page, "/app/checkin/", 1500);
  check("checkin: muestra fuente de datos", (await page.getByText(/prototipo conectado|sin prototipo/i).count()) > 0);
  check("checkin: guía de conexión visible", (await page.getByText(/cómo conectar el prototipo/i).count()) > 0);
  await page.getByText(/cómo conectar el prototipo/i).click();
  check("checkin: guía explica Wi-Fi y WebSocket", (await page.getByText(/SET WIFI/i).count()) > 0 && (await page.getByText(/SET WS/i).count()) > 0);

  await go(page, "/app/rutina/", 1200);
  await page.getByText("Cuádriceps", { exact: true }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /escanear y crear rutina/i }).click();
  await page.waitForTimeout(800);
  check("rutina: aparece la captura", (await page.getByText(/pon la yema en el sensor óptico/i).count()) > 0);
  await page.getByRole("button", { name: /^simular$/i }).click();
  await page.waitForTimeout(12_000);
  check("rutina: resultado visible", (await page.getByText(/tu rutina de hoy/i).count()) > 0);
  check("rutina: no quedó vacía", (await page.getByText(/quedó vacía/i).count()) === 0);
  check("rutina: sin errores de consola", net.errors.length === 0, net.errors[0]);

  await go(page, "/app/entreno/", 1500);
  check("entreno: carga el plan", (await page.getByText(/empezar|ejercicio/i).count()) > 0);

  await go(page, "/app/perfil/", 1200);
  const shareButton = page.getByRole("button", { name: /crear enlace/i });
  await shareButton.scrollIntoViewIfNeeded();
  await shareButton.click();
  await page.waitForTimeout(1200);
  const openLink = page.getByRole("link", { name: /^abrir$/i }).first();
  check("compartir: enlace creado", (await openLink.count()) === 1);
  const href = await openLink.getAttribute("href");
  check("compartir: enlace usa ?token=", Boolean(href && href.includes("/compartido/?token=")), href ?? "");

  if (href) {
    const guestContext = await contextFor();
    const guest = await guestContext.newPage();
    await guest.goto(href.startsWith("http") ? href : `${BASE}${href}`, { waitUntil: "networkidle" });
    await guest.waitForTimeout(1200);
    check("compartir: invitada ve el nombre", (await guest.getByText(/nicolasa/i).count()) > 0);
    check(
      "compartir: invitada ve perfil y rutina",
      (await guest.getByText(/perfil/i).count()) > 0 && (await guest.getByText(/rutina/i).count()) > 0,
    );
    await guestContext.close();
  }

  const beforeShareDelete = deleteMethods.length;
  await page.getByRole("button", { name: /borrar enlace/i }).first().click();
  await page.waitForTimeout(400);
  const confirmShare = page.locator("dialog[open]");
  await confirmShare.getByRole("button", { name: /^borrar enlace$/i }).click();
  await page.waitForTimeout(800);
  check(
    "compartir: borrar enlace usa DELETE",
    deleteMethods.slice(beforeShareDelete).some((url) => url.includes("/shares/")),
    deleteMethods.slice(beforeShareDelete).join(" | "),
  );

  check("atleta: sin 4xx/5xx inesperados", net.bad.length === 0, net.bad.join(" | "));
  await context.close();
}

/* --- Role guards ----------------------------------------------------------- */

{
  const context = await contextFor(gymToken);
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  check("roles: gym admin no entra a /admin", new URL(page.url()).pathname.startsWith("/gym"));
  await context.close();
}
{
  const context = await contextFor(athleteToken);
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  check("roles: atleta no entra a /admin", new URL(page.url()).pathname.startsWith("/app"));
  await context.close();
}

/* --- API method audit ------------------------------------------------------ */

{
  const share = await fetch(`${API}/api/v1/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${athleteToken}` },
    body: JSON.stringify({ role: "TRAINER", permissions: ["ROUTINE"], label: `e2e-${stamp}` }),
  });
  const shareBody = await share.json();
  const removed = await fetch(`${API}/api/v1/shares/${shareBody.token}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${athleteToken}` },
  });
  check("api: POST crear enlace + DELETE borrar", share.ok && removed.ok, `${share.status}/${removed.status}`);
  check("api: existe al menos un DELETE real", deleteMethods.length > 0, deleteMethods.join(" | "));
}

await browser.close();

const total = results.length;
const passed = results.filter((item) => item.pass).length;
console.log(`\n${passed}/${total} checks passed`);
if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exitCode = 1;
}
