/**
 * Último check-in de sensores hecho en este dispositivo.
 *
 * El check-in verifica que los tres sensores respondan; no reemplaza la
 * telemetría del ESP32 (esa llega por WebSocket). Se guarda local para que Hoy
 * y Rutina muestren si ya se verificó hoy.
 */

import { todayISO } from "@/lib/dates";

export type Checkin = {
  bpm: number;
  forceKg: number;
  tempC: number;
  /** ISO timestamp of the measurement. */
  at: string;
};

const KEY = "syncfit-checkin";

export function readCheckin(): Checkin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Checkin>;
    if (
      typeof parsed.bpm !== "number" ||
      typeof parsed.forceKg !== "number" ||
      typeof parsed.tempC !== "number" ||
      typeof parsed.at !== "string"
    ) {
      return null;
    }
    return parsed as Checkin;
  } catch {
    return null;
  }
}

export function saveCheckin(values: Omit<Checkin, "at">): Checkin {
  const record: Checkin = { ...values, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Storage full or blocked: the flow still works, it just won't be remembered.
  }
  return record;
}

/** True when the last check-in happened today (device local date). */
export function isCheckinToday(checkin: Checkin | null): checkin is Checkin {
  if (!checkin) return false;
  const day = new Date(checkin.at);
  if (Number.isNaN(day.getTime())) return false;
  const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  return iso === todayISO();
}
