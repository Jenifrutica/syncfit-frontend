/**
 * Client-side checks that mirror the backend rules (syncfit-backend
 * app/services/validation.py and app/api/auth.py) so errors show before submit.
 */

const NAME_RE = /^\p{L}+(?:[ '\-.]\p{L}+)*\.?$/u;

export function normalizeName(value: string): string {
  return value.split(/\s+/).filter(Boolean).join(" ");
}

export function isValidName(value: string): boolean {
  const name = normalizeName(value);
  return name.length >= 2 && name.length <= 60 && NAME_RE.test(name);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidDocumentId(value: string): boolean {
  return /^[0-9]{6,15}$/.test(value.trim());
}

export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  special: boolean;
};

/** What a new password needs: 8-128 chars, upper, lower, number and symbol. */
export function passwordChecks(value: string): PasswordChecks {
  return {
    length: value.length >= 8 && value.length <= 128,
    upper: /\p{Lu}/u.test(value),
    lower: /\p{Ll}/u.test(value),
    digit: /\d/.test(value),
    special: /[^\p{L}\p{N}\s]/u.test(value),
  };
}

export function isValidNewPassword(value: string): boolean {
  return Object.values(passwordChecks(value)).every(Boolean);
}

export function inRange(value: number | null | undefined, min: number, max: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
