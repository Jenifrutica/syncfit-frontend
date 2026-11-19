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


test("cambiar de la fase ovulatoria a otra conserva las dimensiones de los d�as", async ({ page, signIn }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(await newAthlete());
  await page.goto("/app/calendario/");
  const ovulatory = page.locator('[data-phase="OVULATORY"]').first();
  const other = page.locator('[data-phase]:not([data-phase="OVULATORY"])').first();
  const dimensions = () => page.locator("[data-date]").evaluateAll((cells) =>
    cells.map((cell) => [cell.clientWidth, cell.clientHeight])
  );
  await ovulatory.click();
  await expect(ovulatory).toHaveAttribute("aria-pressed", "true");
  const before = await dimensions();
  await other.click();
  await expect(other).toHaveAttribute("aria-pressed", "true");
  expect(await dimensions()).toEqual(before);
});
