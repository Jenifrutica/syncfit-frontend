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

export function isValidNewPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 128;
}

export function inRange(value: number | null | undefined, min: number, max: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
