"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Barbell, Check, Fingerprint, Heartbeat, Play, Thermometer } from "@phosphor-icons/react";

import { HardwareGuide } from "@/components/captura/HardwareGuide";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pulsi } from "@/components/mascot/Pulsi";
import { getLive, tareDevice, type LiveStatus } from "@/lib/api";
import { saveCheckin, type Checkin } from "@/lib/checkin";
import { cx } from "@/lib/cx";
import { t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/**
 * Check-in guiado, un sensor por paso.
 *
 * Cada paso muestra a Pulsi dentro de un lente circular. Un anillo alrededor
 * del lente se llena mientras corre la toma, y sobre la zona exacta del sensor
 * hay un punto con su icono (huella, flecha o termómetro). Al completarse el
 * anillo aparece el visto y el flujo avanza solo al paso siguiente.
 *
 * Los valores vienen de `useSensores`. Hoy simula; cuando el ESP32 esté
 * conectado se reemplaza el cuerpo de ese hook por la lectura del WebSocket.
 * Al terminar, el resultado se guarda con `saveCheckin()`.
 */

type Paso = 0 | 1 | 2;
type Fase = "listo" | "midiendo" | "hecho";

const DURACION_MS = 2600;
/** Simulated run: fast enough to keep the demo moving, slow enough to see the ring. */
const SIMULACION_MS = 700;
const ESPERA_SIMULADA_MS = 350;
const ESPERA_VISTO_MS = 900;
const LENTE = 240;
const ANILLO = 264;
const MASCOTA = 186;

/** Punto de la zona en coordenadas del viewBox de Pulsi (160 × 170). */
type Zona = { x: number; y: number };

const PASOS = [
  {
    id: 0 as Paso,
    clave: "pulso",
    icono: Heartbeat,
    sensor: Fingerprint,
    unidad: "bpm",
    final: 72,
    desde: 58,
    zona: { x: 80, y: 146 } as Zona,
  },
  {
    id: 1 as Paso,
    clave: "fuerza",
    icono: Barbell,
    sensor: ArrowDown,
    unidad: "kg",
    final: 8.4,
    desde: 0,
    zona: { x: 80, y: 152 } as Zona,
  },
  {
    id: 2 as Paso,
    clave: "temperatura",
    icono: Thermometer,
    sensor: Thermometer,
    unidad: "°C",
    final: 33.5,
    desde: 31.6,
    zona: { x: 66, y: 102 } as Zona,
  },
];

/** Convierte el punto de la zona al espacio del lente. */
function enLente({ x, y }: Zona) {
  const s = MASCOTA / 160;
  const alto = (MASCOTA * 170) / 160;
  return {
    x: (LENTE - MASCOTA) / 2 + x * s,
    y: (LENTE - alto) / 2 + y * s,
  };
}

/** Anillo de progreso que rodea el lente. */
function Anillo({ progreso }: { progreso: number }) {
  const r = ANILLO / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={ANILLO}
      height={ANILLO}
      viewBox={`0 0 ${ANILLO} ${ANILLO}`}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90"
      aria-hidden
    >
      <circle cx={ANILLO / 2} cy={ANILLO / 2} r={r} fill="none" strokeWidth={9} className="stroke-ink/10" />
      <circle
        cx={ANILLO / 2}
        cy={ANILLO / 2}
        r={r}
        fill="none"
        strokeWidth={9}
        strokeLinecap="round"
        className="stroke-ink"
        style={{
          strokeDasharray: c,
          strokeDashoffset: c * (1 - progreso),
          opacity: progreso > 0.001 ? 1 : 0,
        }}
      />
    </svg>
  );
}

type LiveValues = { bpm: number; forceKg: number; tempC: number };

const LIVE_POLL_MS = 1000;
const FORCE_POLL_MS = 250;

/** Latest real readings from the prototype, or null when it is not connected. */
function liveValuesFrom(status: LiveStatus | null): LiveValues | null {
  if (!status?.connected || !status.frame) return null;
  const b = status.frame.biomarkers;
  // The fast force channel (~100 ms) beats the 2.56 s frame when it is fresh.
  const fast = status.force && status.force.age_seconds < 1 ? status.force.force_kg : null;
  return {
    bpm: Math.max(0, Math.round(b.heart_rate_bpm ?? 0)),
    forceKg: Math.max(0, Number((fast ?? b.force_kg ?? 0).toFixed(1))),
    tempC: Number((b.object_temperature_c ?? 0).toFixed(1)),
  };
}

function valueForStep(step: number, liveValues: LiveValues | null): number {
  if (!liveValues) return PASOS[step].final;
  if (step === 0) return liveValues.bpm;
  if (step === 1) return liveValues.forceKg;
  return liveValues.tempC;
}

/** Real prototype values when connected; simulated animation otherwise. */
function useSensores(
  fase: Fase,
  progreso: number,
  paso: (typeof PASOS)[number],
  liveValues: LiveValues | null,
  modo: "manual" | "simulado",
) {
  return useMemo(() => {
    if (modo === "manual" && liveValues) {
      const value = valueForStep(paso.id, liveValues);
      // Without a finger the optical sensor reports 0 bpm: show "—", not 0.
      return paso.id === 0 && value === 0 ? null : value;
    }
    if (fase === "listo") return null;
    const f = fase === "hecho" ? 1 : progreso;
    const v = paso.desde + (paso.final - paso.desde) * f;
    return paso.unidad === "bpm" ? Math.round(v) : Number(v.toFixed(1));
  }, [fase, progreso, paso, liveValues, modo]);
}

type CapturaProps = {
  /** Final CTA on the standalone screen (demo / check-in page). */
  onDone?: () => void;
  /** Called when the three readings are done; the routine uses it to start generating. */
  onComplete?: (values: Checkin) => void;
  /** Leaves the flow (only shown when provided). */
  onCancel?: () => void;
};

export function CapturaSensores({ onDone, onComplete, onCancel }: CapturaProps) {
  const { language } = useSession();
  const [paso, setPaso] = useState<Paso>(0);
  const [fase, setFase] = useState<Fase>("listo");
  const [progreso, setProgreso] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const [resultados, setResultados] = useState<number[]>([]);
  const [modo, setModo] = useState<"manual" | "simulado">("manual");
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [taring, setTaring] = useState(false);
  const [tareMessage, setTareMessage] = useState<string | null>(null);
  const raf = useRef<number | null>(null);
  const resultadosRef = useRef<number[]>([]);
  // Peak push of the force step and whether any reading came from the device.
  const peakForceRef = useRef(0);
  const fromDeviceRef = useRef(false);
  const liveValues = useMemo(() => liveValuesFrom(live), [live]);
  const liveValuesRef = useRef<LiveValues | null>(null);

  useEffect(() => {
    liveValuesRef.current = liveValues;
  }, [liveValues]);

  useEffect(() => {
    setTareMessage(null);
  }, [paso]);

  // Poll faster on the force step so the reading follows the push.
  const pasoRef = useRef(paso);
  useEffect(() => {
    pasoRef.current = paso;
  }, [paso]);

  const actual = PASOS[paso];
  const Icono = actual.icono;
  const Sensor = actual.sensor;
  const valor = useSensores(fase, progreso, actual, liveValues, modo);
  const centro = enLente(actual.zona);

  const etiqueta = (clave: string) => t(language, `captura.${clave}`);

  // Is the prototype streaming? Polled only while this screen is mounted.
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    const tick = async () => {
      try {
        const status = await getLive();
        if (alive) setLive(status);
      } catch {
        if (alive) setLive(null);
      }
      if (alive) timer = window.setTimeout(tick, pasoRef.current === 1 ? FORCE_POLL_MS : LIVE_POLL_MS);
    };
    void tick();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // Track the peak push while the force step is measuring.
  useEffect(() => {
    if (paso === 1 && fase === "midiendo" && modo === "manual" && liveValues) {
      peakForceRef.current = Math.max(peakForceRef.current, liveValues.forceKg);
    }
  }, [paso, fase, modo, liveValues]);

  useEffect(() => {
    if (paso === 1 && fase === "listo") peakForceRef.current = 0;
  }, [paso, fase]);

  useEffect(() => {
    if (fase !== "midiendo") return;
    const duracion = modo === "simulado" ? SIMULACION_MS : DURACION_MS;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duracion);
      setProgreso(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setFase("hecho");
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [fase, modo]);

  useEffect(() => {
    if (fase !== "hecho") return;
    const espera = modo === "simulado" ? ESPERA_SIMULADA_MS : ESPERA_VISTO_MS;
    const id = window.setTimeout(() => {
      const live = modo === "manual" ? liveValuesRef.current : null;
      if (live) fromDeviceRef.current = true;
      let captured = valueForStep(paso, live);
      // Force: what matters is the best push of the step, not the last instant.
      if (paso === 1 && live) captured = Math.max(captured, Number(peakForceRef.current.toFixed(1)));
      resultadosRef.current = [...resultadosRef.current, captured];
      setResultados(resultadosRef.current);
      if (paso < 2) {
        setPaso((p) => (p + 1) as Paso);
        setProgreso(0);
        setFase("listo");
      } else {
        const [bpm, forceKg, tempC] = resultadosRef.current;
        const record = saveCheckin({ bpm, forceKg, tempC, source: fromDeviceRef.current ? "device" : "simulated" });
        if (onComplete) onComplete(record);
        else setTerminado(true);
      }
    }, espera);
    return () => window.clearTimeout(id);
  }, [fase, paso, modo, onComplete]);

  // A simulated run advances on its own: each new step starts measuring after a beat.
  useEffect(() => {
    if (modo !== "simulado" || terminado || fase !== "listo") return;
    const id = window.setTimeout(() => {
      setProgreso(0);
      setFase("midiendo");
    }, 80);
    return () => window.clearTimeout(id);
  }, [modo, fase, terminado]);

  const medir = useCallback(() => {
    setModo("manual");
    setProgreso(0);
    setFase("midiendo");
  }, []);

  const onTare = async () => {
    setTaring(true);
    setTareMessage(null);
    try {
      await tareDevice();
      setTareMessage(t(language, "captura.tareEnviado"));
    } catch {
      setTareMessage(t(language, "captura.tareError"));
    } finally {
      setTaring(false);
    }
  };

  const simular = useCallback(() => {
    setModo("simulado");
    setProgreso(0);
    setFase("midiendo");
  }, []);

  const reiniciar = useCallback(() => {
    setTerminado(false);
    resultadosRef.current = [];
    peakForceRef.current = 0;
    fromDeviceRef.current = false;
    setResultados([]);
    setModo("manual");
    setPaso(0);
    setProgreso(0);
    setFase("listo");
  }, []);

  if (terminado) {
    const pulso = resultados[0] ?? PASOS[0].final;
    const fuerza = resultados[1] ?? PASOS[1].final;
    const temperatura = resultados[2] ?? PASOS[2].final;
    return (
      <Card tone="fase-suave" padding="lg" className="mx-auto w-full max-w-lg">
        <div className="flex items-center gap-3">
          <span className="motion-safe:animate-entrar-visto grid size-12 place-items-center rounded-full bg-ink text-nube">
            <Check size={26} weight="bold" />
          </span>
          <div>
            <h2 className="font-display text-h3 font-bold text-ink">{t(language, "captura.final")}</h2>
            <p className="text-small text-ink/70">{t(language, "captura.finalTexto")}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            [etiqueta("pulso"), `${pulso} bpm`],
            [etiqueta("fuerza"), `${Number(fuerza).toFixed(1)} kg`],
            [etiqueta("temperaturaCorta"), `${Number(temperatura).toFixed(1)} °C`],
          ].map(([k, v], i) => (
            <div
              key={k}
              className="motion-safe:animate-entrar-tarjeta rounded-2xl bg-nube/70 px-2 py-4"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/50">{k}</dt>
              <dd className="mt-1 font-display text-body-lg font-bold tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {onDone && (
          <Button className="mt-6" fullWidth size="lg" onClick={onDone}>
            {t(language, "captura.continuar")}
          </Button>
        )}
        <Button className={cx(onDone ? "mt-2" : "mt-6")} variant="secundario" fullWidth onClick={reiniciar}>
          {t(language, "captura.repetir")}
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="self-start rounded-full px-2 py-1 text-small font-extrabold text-ink-suave hover:bg-rosa-claro"
        >
          {t(language, "captura.volver")}
        </button>
      )}

      {live?.connected ? (
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-exito-suave px-3 py-1 text-small font-bold text-exito">
          <span aria-hidden="true" className="size-2 rounded-full bg-exito" />
          {tf(language, "captura.conectado", { s: Math.round(live.age_seconds ?? 0) })}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-rosa-claro px-3 py-1 text-small font-bold text-ink-suave">
          <span aria-hidden="true" className="size-2 rounded-full bg-ink/30" />
          {t(language, "captura.sinPrototipo")}
        </span>
      )}

      <div className="flex items-center gap-2" aria-hidden>
        {PASOS.map((p, i) => (
          <span
            key={p.id}
            className={cx(
              "h-1.5 flex-1 rounded-full transition-colors duration-300 ease-[var(--ease-salida)]",
              i < paso ? "bg-ink" : i === paso ? "bg-ink/70" : "bg-ink/15",
            )}
          />
        ))}
      </div>

      <Card className="overflow-hidden" padding="lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">
            {tf(language, "captura.paso", { n: paso + 1 })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rosa-claro px-3 py-1 text-small font-bold text-ink">
            <Icono size={15} weight="bold" />
            {etiqueta(actual.clave)}
          </span>
        </div>

        {/* Lente con Pulsi, punto del sensor y anillo de progreso */}
        <div className="relative mx-auto mt-4 max-[380px]:scale-90" style={{ width: ANILLO, height: ANILLO }}>
          <div
            key={paso}
            className="motion-safe:animate-entrar-lente absolute left-1/2 top-1/2 overflow-hidden rounded-full bg-fase-suave"
            style={{ width: LENTE, height: LENTE, marginLeft: -LENTE / 2, marginTop: -LENTE / 2 }}
          >
            {paso === 1 && (
              <span
                className="absolute rounded-[10px] bg-[#6B4A2F] shadow-[0_4px_0_#523a25]"
                style={{ left: 34, width: LENTE - 68, top: 206, height: 18 }}
                aria-hidden
              />
            )}

            <div
              className={cx(
                "absolute inset-0 grid place-items-center transition-transform duration-300 ease-[var(--ease-salida)]",
                fase === "midiendo" && paso === 1 && "translate-y-[5px]",
              )}
            >
              <Pulsi mood="feliz" size={MASCOTA} wings />
            </div>

            {/* Punto del sensor, sobre la zona exacta */}
            <span
              className={cx(
                "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full",
                "transition-transform duration-300 ease-[var(--ease-salida)]",
                paso === 2
                  ? "size-11 bg-transparent ring-2 ring-ink/30"
                  : "size-10 bg-nube/70 ring-1 ring-ink/15 shadow-[0_2px_8px_-2px_rgb(42_29_101_/_0.35)]",
                fase === "listo" && "motion-safe:animate-latir",
                fase === "midiendo" && "scale-105",
              )}
              style={{ left: centro.x, top: centro.y }}
              aria-hidden
            >
              {paso === 2 ? (
                <span className="absolute -left-2 -top-2 grid size-[26px] place-items-center rounded-full bg-nube text-ink/70 ring-1 ring-ink/10 shadow-[0_2px_8px_-2px_rgb(42_29_101_/_0.35)]">
                  <Sensor size={13} weight="bold" />
                </span>
              ) : (
                <Sensor size={20} weight="bold" className="text-ink/70" />
              )}
            </span>
          </div>

          {fase === "hecho" && (
            <span
              className="motion-safe:animate-entrar-visto absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-nube bg-ink text-nube shadow-[var(--shadow-boton)]"
              style={{ left: ANILLO / 2 + 88, top: ANILLO / 2 + 88 }}
            >
              <Check size={22} weight="bold" />
            </span>
          )}

          <Anillo progreso={progreso} />
        </div>

        <h2 className="mt-5 text-center font-display text-h3 font-bold leading-tight text-ink">
          {etiqueta(`instruccion.${actual.clave}`)}
        </h2>
        <p className="mt-1 text-center text-small text-ink/65">{etiqueta(`detalle.${actual.clave}`)}</p>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-crema px-4 py-3">
          <span className="text-small font-semibold text-ink/60">{etiqueta(actual.clave)}</span>
          <span
            className={cx(
              "font-display text-body-lg font-bold tabular-nums",
              valor !== null ? "text-ink" : "text-ink/30",
            )}
          >
            {valor !== null ? `${valor} ${actual.unidad}` : "—"}
          </span>
        </div>

        {paso === 1 && live?.connected && (
          <div className="mt-3">
            <Button variant="suave" size="sm" fullWidth loading={taring} onClick={() => void onTare()}>
              {t(language, "captura.tare")}
            </Button>
            {tareMessage && (
              <p className="mt-2 text-center text-small font-semibold text-ink-suave">{tareMessage}</p>
            )}
          </div>
        )}

        <Button className="mt-4" fullWidth size="lg" onClick={medir} disabled={fase !== "listo"}>
          {fase === "listo" ? t(language, "captura.medir") : fase === "midiendo" ? t(language, "captura.midiendo") : t(language, "captura.hecho")}
        </Button>

        {fase === "listo" && (
          <Button
            className="mt-2"
            variant="fantasma"
            fullWidth
            icon={<Play size={16} weight="bold" />}
            onClick={simular}
          >
            {t(language, "captura.simular")}
          </Button>
        )}
        <p className="sr-only" role="status" aria-live="polite">
          {fase === "midiendo" ? tf(language, "captura.estadoMidiendo", { sensor: etiqueta(actual.clave) }) : fase === "hecho" ? tf(language, "captura.estadoListo", { sensor: etiqueta(actual.clave) }) : ""}
        </p>
      </Card>

      <HardwareGuide
        connected={Boolean(live?.connected)}
        ageSeconds={live?.age_seconds}
        deviceId={live?.device_id}
      />

      <p className="text-center text-[11px] text-ink/45">{t(language, "captura.aviso")}</p>
    </div>
  );
}
