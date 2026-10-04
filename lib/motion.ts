/**
 * Motion tokens for the Motion library, mirroring app/tokens.css.
 * App motion stays 120–300 ms and only animates transform/opacity.
 */

export const DUR = {
  toque: 0.12,
  ui: 0.2,
  panel: 0.3,
} as const;

export const EASE = {
  salida: [0.22, 1, 0.36, 1],
  entrada: [0.64, 0, 0.78, 0],
} as const;

/** Stagger for lists that "fall" into place (routine cards). */
export const CASCADA = 0.06;
