/** Pure logic of "select all" with a limit (no browser needed). */
import { expect, test } from "@playwright/test";

import { fillUpTo } from "../../lib/seleccion";

test.describe("fillUpTo", () => {
  test("sin límite añade todo lo que falta, conservando el orden actual", () => {
    expect(fillUpTo(["a", "b", "c"], ["c"])).toEqual(["c", "a", "b"]);
  });

  test("respeta el máximo", () => {
    expect(fillUpTo(["a", "b", "c", "d", "e"], ["b"], 4)).toEqual(["b", "a", "c", "d"]);
    expect(fillUpTo(["a", "b"], ["a", "b"], 1)).toEqual(["a", "b"]);
  });

  test("salta lo que la regla rechaza según lo ya elegido", () => {
    const incompatible: Record<string, string> = { a: "b", b: "a" };
    const canAdd = (v: string, current: readonly string[]) => !current.includes(incompatible[v]);
    expect(fillUpTo(["a", "b", "c"], [], 4, canAdd)).toEqual(["a", "c"]);
  });

  test("no muta la selección recibida", () => {
    const selected = ["a"];
    fillUpTo(["a", "b"], selected);
    expect(selected).toEqual(["a"]);
  });
});
