/**
 * "Select all" for a list of options, with an optional limit and a rule that
 * can reject an option given what is already chosen (e.g. incompatible muscle
 * groups). Keeps the current choices first and adds the rest in list order.
 */
export function fillUpTo(
  values: readonly string[],
  selected: readonly string[],
  max = Infinity,
  canAdd: (value: string, current: readonly string[]) => boolean = () => true,
): string[] {
  const next = [...selected];
  for (const value of values) {
    if (next.length >= max) break;
    if (!next.includes(value) && canAdd(value, next)) next.push(value);
  }
  return next;
}
