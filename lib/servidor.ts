/**
 * Backend status for the "the server is loading" notice. Every API call goes
 * through trackedFetch (lib/api.ts shadows fetch with it); this module keeps
 * the start time of the calls in flight and whether the last one could not
 * reach the server at all. Long AI calls are not tracked: they have their
 * own progress screens.
 */

export type EstadoServidor = "ok" | "lento" | "muy-lento" | "caido";

/** After this long a call counts as slow, then as very slow. */
export const LENTO_MS = 2000;
export const MUY_LENTO_MS = 8000;

/** Calls that are slow on purpose (AI, routine capture, live sensor). */
const SIN_SEGUIMIENTO = [/\/api\/v1\/capture/, /\/api\/v1\/symptoms\/analyze/, /\/api\/v1\/live/, /\/api\/v1\/telemetry/];

export function seSigue(url: string): boolean {
  return url.includes("/api/v1/") && !SIN_SEGUIMIENTO.some((pattern) => pattern.test(url));
}

/** Pure: the status from the start times of pending calls and the last network failure. */
export function estadoServidor(pendientes: readonly number[], ahora: number, caido: boolean): EstadoServidor {
  if (caido) return "caido";
  const masVieja = pendientes.length ? Math.min(...pendientes) : ahora;
  const espera = ahora - masVieja;
  if (espera >= MUY_LENTO_MS) return "muy-lento";
  if (espera >= LENTO_MS) return "lento";
  return "ok";
}

const pendientes = new Map<number, number>();
let siguiente = 0;
let caido = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((fn) => fn());

export function suscribirServidor(fn: () => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Snapshot for the notice: start times of tracked calls in flight and the failure flag. */
export function leerServidor(): { pendientes: number[]; caido: boolean } {
  return { pendientes: [...pendientes.values()], caido };
}

/** fetch that reports to the notice. Same signature and behaviour as fetch. */
export async function trackedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (typeof window === "undefined" || !seSigue(url)) return fetch(input, init);
  const id = siguiente++;
  pendientes.set(id, Date.now());
  avisar();
  try {
    const response = await fetch(input, init);
    if (caido) caido = false;
    return response;
  } catch (error) {
    // A network error (not an abort) means the server could not be reached.
    if (!(error instanceof DOMException && error.name === "AbortError")) caido = true;
    throw error;
  } finally {
    pendientes.delete(id);
    avisar();
  }
}
