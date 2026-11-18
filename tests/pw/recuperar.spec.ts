/** «¿Olvidaste tu contraseña?»: correo simulado para cuentas de prueba, real para el resto. */
import { expect, newAthlete, test, watch } from "./fixtures";
import { DEMO_ATHLETE } from "./global-setup";

async function simulatedChange(page: import("@playwright/test").Page, from: string, to: string) {
  await page.goto(`/recuperar/?correo=${encodeURIComponent(DEMO_ATHLETE.email)}`);
  await expect(page.locator("[data-aviso-temporal]")).toContainText(/correos temporales/i);
  await page.getByRole("button", { name: /enviar/i }).click();
  const mail = page.locator("[data-correo-simulado]");
  await expect(mail).toBeVisible();
  await expect(mail).toContainText(/correo de simulación/i);
  await expect(mail).toContainText(DEMO_ATHLETE.email);
  await page.locator("#recuperar-clave").fill(to);
  await page.locator("#recuperar-confirmar").fill(to);
  await page.getByRole("button", { name: /^cambiar contraseña$/i }).click();
  await expect(page.getByRole("status").filter({ hasText: /contraseña cambiada/i })).toBeVisible();
  void from;
}

test.describe("recuperar contraseña", () => {
  test("cuenta de prueba: el correo se simula y la clave se cambia en pantalla", async ({ page }) => {
    const net = watch(page);
    const nueva = "PwDemo2027!";
    await simulatedChange(page, DEMO_ATHLETE.password, nueva);
    expect(net.count("POST /api/v1/auth/forgot/simulated")).toBe(1);
    expect(net.calls).not.toContain("POST /api/v1/auth/forgot"); // nothing was emailed

    // The new password works; the old one no longer does.
    await page.goto("/entrar/");
    await page.locator("#campo-correo").fill(DEMO_ATHLETE.email);
    await page.locator("#campo-clave").fill(DEMO_ATHLETE.password);
    await page.locator("#boton-entrar").click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await page.locator("#campo-clave").fill(nueva);
    await page.locator("#boton-entrar").click();
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 });

    // Leave it as it was for the quick-access button.
    await page.locator("[data-logout]").click();
    await expect(page).toHaveURL(/\/entrar/);
    await simulatedChange(page, nueva, DEMO_ATHLETE.password);
  });

  test("correo real: se envía el enlace y no se muestra ningún formulario", async ({ page }) => {
    const token = await newAthlete();
    void token;
    let sent = false;
    await page.route("**/api/v1/auth/forgot", (route) => {
      sent = true;
      return route.fulfill({ status: 202, contentType: "application/json", body: '{"status":"sent"}' });
    });
    await page.goto("/recuperar/?correo=persona.real@example.com");
    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.locator("[data-correo-simulado]")).toHaveCount(0);
    await expect(page.locator("#recuperar-clave")).toHaveCount(0);
    await expect.poll(() => sent).toBe(true);
  });
});

test.describe("cerrar sesión arriba a la derecha", () => {
  for (const [role, path] of [["ATHLETE", "/app/"], ["GYM_ADMIN", "/gym/"], ["SUPER_ADMIN", "/admin/"]] as const) {
    test(`${role}: botón en la esquina superior derecha y funciona`, async ({ page, signIn }) => {
      const { demoToken } = await import("./fixtures");
      await signIn(await demoToken(role));
      await page.goto(path);
      const button = page.getByRole("button", { name: /cerrar sesión/i }).first();
      await expect(button).toBeVisible();
      const box = (await button.boundingBox())!;
      const width = page.viewportSize()!.width;
      expect(box.x + box.width).toBeGreaterThan(width * 0.75);
      expect(box.y).toBeLessThan(120);
      await button.click();
      await expect(page).toHaveURL(/\/entrar/);
    });
  }
});
