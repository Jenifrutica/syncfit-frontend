/**
 * Today's self-reported energy. The backend takes energy as a capture
 * parameter (not stored on the profile), so it lives in this browser for the
 * day and pre-fills the next routine.
 */

import type { EnergyLevel } from "@/lib/api";

const key = (date: string) => `syncfit-energia-${date}`;

export function readEnergy(date: string): EnergyLevel | null {
  try {
    const value = window.localStorage.getItem(key(date));
    return value === "ENERGY" || value === "MODERATE" || value === "NO_ENERGY" ? value : null;
  } catch {
    return null;
  }
}

export function saveEnergy(date: string, energy: EnergyLevel): void {
  try {
    window.localStorage.setItem(key(date), energy);
  } catch {
    // Not remembered; the routine screen will ask again.
  }
}
