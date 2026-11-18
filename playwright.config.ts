import { defineConfig, devices } from "@playwright/test";

/**
 * Suite automatizada (Playwright Test). Levanta el backend local (8001) y un
 * export estático del frontend (3100) salvo que ya estén corriendo.
 *
 *   npm run test:e2e            # todo
 *   npx playwright test -g "segundo plano"
 *   npx playwright show-report  # informe HTML
 *
 * Nunca apuntarla a producción: crea y borra datos. Para producción está
 * tests/e2e/smoke-prod.mjs (solo lectura).
 */
const API = process.env.E2E_API ?? "http://localhost:8001";
const BASE = process.env.E2E_BASE ?? "http://localhost:3100";

export default defineConfig({
  testDir: "tests/pw",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE,
    locale: "es-ES",
    viewport: { width: 430, height: 940 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "movil", use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 940 } } },
  ],
  webServer: [
    { command: "bash scripts/e2e-backend.sh", url: `${API}/api/v1/health`, reuseExistingServer: true, timeout: 60_000 },
    { command: "bash scripts/e2e-frontend.sh", url: `${BASE}/entrar/`, reuseExistingServer: true, timeout: 300_000 },
  ],
});
