/**
 * Calendario en escritorio: la cuadrícula del mes llena su tarjeta (sin una
 * franja vacía bajo la última semana) y los días no se montan entre sí.
 */
import { expect, newAthlete, test } from "./fixtures";

for (const width of [1100, 1280, 1440]) {
  test(`calendario ${width}px: sin espacio vacío bajo la última semana`, async ({ page, signIn }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(await newAthlete());
    await page.goto("/app/calendario/");
    const days = page.locator("[data-date]");
    await expect(days.first()).toBeVisible();

    const m = await page.evaluate(() => {
      const cells = [...document.querySelectorAll<HTMLElement>("[data-date]")];
      const card = cells[0].closest(".rounded-nube")!.getBoundingClientRect();
      const last = cells[cells.length - 1].getBoundingClientRect();
      // Worst overlap between neighbours on the same row (negative = there is a gap).
      let overlap = -Infinity;
      for (let i = 1; i < cells.length; i++) {
        const a = cells[i - 1].getBoundingClientRect();
        const b = cells[i].getBoundingClientRect();
        if (Math.abs(a.top - b.top) < 1) overlap = Math.max(overlap, a.right - b.left);
      }
      return { gap: card.bottom - last.bottom, overlap };
    });
    expect(m.gap).toBeLessThanOrEqual(40);
    expect(m.overlap).toBeLessThanOrEqual(0);
  });
}
