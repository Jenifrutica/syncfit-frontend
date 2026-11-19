/** Classifier behind the "the server is loading" notice (pure logic). */
import { expect, test } from "@playwright/test";

import { LENTO_MS, MUY_LENTO_MS, estadoServidor, seSigue } from "../../lib/servidor";

test.describe("estadoServidor", () => {
  test("sin llamadas pendientes todo está bien", () => {
    expect(estadoServidor([], 10_000, false)).toBe("ok");
  });

  test("lento y muy lento según la llamada más vieja", () => {
    expect(estadoServidor([1000, 9000], 1000 + LENTO_MS, false)).toBe("lento");
    expect(estadoServidor([1000], 1000 + MUY_LENTO_MS, false)).toBe("muy-lento");
    expect(estadoServidor([1000], 1000 + LENTO_MS - 1, false)).toBe("ok");
  });

  test("si no se pudo llegar al servidor, manda el aviso de caído", () => {
    expect(estadoServidor([], 0, true)).toBe("caido");
  });

  test("no sigue las llamadas largas a propósito", () => {
    expect(seSigue("http://x/api/v1/stats")).toBe(true);
    expect(seSigue("http://x/api/v1/capture?x=1")).toBe(false);
    expect(seSigue("http://x/api/v1/symptoms/analyze")).toBe(false);
    expect(seSigue("http://x/api/v1/live")).toBe(false);
    expect(seSigue("https://fonts.example/a.css")).toBe(false);
  });
});
