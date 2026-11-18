/** Acceso rápido: el botón rellena usuario y contraseña; el resto lo hace la persona. */
import { expect, test, watch } from "./fixtures";
import { DEMO_ATHLETE } from "./global-setup";

test.describe("acceso rápido en /entrar", () => {
  test("el botón rellena correo y contraseña sin entrar solo", async ({ page }) => {
    const net = watch(page);
    await page.goto("/entrar/");
    await page.locator('[data-demo="ATHLETE"]').click();
    await expect(page.locator("#campo-correo")).toHaveValue(DEMO_ATHLETE.email);
    await expect(page.locator("#campo-clave")).toHaveValue(DEMO_ATHLETE.password);
    await expect(page.getByText(/datos rellenados/i)).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/entrar/); // did not sign in by itself
    expect(net.count("POST /api/v1/auth/demo")).toBe(0);
    expect(net.count("POST /api/v1/auth/login")).toBe(0);
  });

  test("tras rellenar, «Entrar» inicia sesión con esas credenciales", async ({ page }) => {
    const net = watch(page);
    await page.goto("/entrar/");
    await page.locator('[data-demo="ATHLETE"]').click();
    await page.locator("#boton-entrar").click();
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 });
    expect(net.count("POST /api/v1/auth/login")).toBe(1);
    expect(net.count("POST /api/v1/auth/demo")).toBe(0);
  });

  test("«¿Olvidaste tu contraseña?» lleva el correo rellenado", async ({ page }) => {
    await page.goto("/entrar/");
    await page.locator('[data-demo="ATHLETE"]').click();
    await page.locator("[data-forgot]").click();
    await expect(page).toHaveURL(/\/recuperar\/\?correo=/);
    await expect(page.getByRole("textbox").first()).toHaveValue(DEMO_ATHLETE.email);
  });

  test("sin credenciales configuradas el botón sigue entrando con un clic", async ({ page }) => {
    await page.goto("/entrar/");
    await page.locator('[data-demo="GYM_ADMIN"]').click(); // not in the test config: one-click fallback
    await expect(page).toHaveURL(/\/gym/, { timeout: 30_000 });
  });

  test("una contraseña cambiada a mano da error claro y no entra", async ({ page }) => {
    await page.goto("/entrar/");
    await page.locator('[data-demo="ATHLETE"]').click();
    await page.locator("#campo-clave").fill("otra-clave-mal");
    await page.locator("#boton-entrar").click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page).toHaveURL(/\/entrar/);
  });
});
