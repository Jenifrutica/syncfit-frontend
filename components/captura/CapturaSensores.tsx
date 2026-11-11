"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, HandPointing, Heartbeat, Thermometer, WaveTriangle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pulsi } from "@/components/mascot/Pulsi";
import { cx } from "@/lib/cx";

/**
 * Captura guiada de los tres sensores, paso a paso.
 *
 * Cada paso muestra a Pulsi con la zona resaltada y un hueco reservado para la
 * animación (ver `HuecoAnimacion`). Los valores llegan de `useSensores`, que hoy
 * simula; cuando el ESP32 esté conectado se cambia solo esa fuente.
 */

type Paso = 0 | 1 | 2;

type Lectura = {
  bpm: number | null;
  fuerza: number | null;
  temperatura: number | null;
};

const PASOS: Array<{
  id: Paso;
  titulo: string;
  instruccion: string;
  detalle: string;
  animacion: string;
  icono: typeof Heartbeat;
}> = [
  {
    id: 0,
    titulo: "Pulso",
    instruccion: "Apoya la yema del dedo en la panza de Pulsi",
    detalle: "Cubre el aro completo y no muevas la mano 10 segundos.",
    animacion: "Dedo bajando hasta el aro de la panza + aro que late",
    icono: Heartbeat,
  },
  {
    id: 1,
    titulo: "Fuerza",
    instruccion: "Aprieta las alas de Pulsi",
    detalle: "Aprieta 3 segundos y suelta despacio.",
    animacion: "Alas comprimiéndose + barra de fuerza subiendo",
    icono: WaveTriangle,
  },
  {
    id: 2,
    titulo: "Temperatura",
    instruccion: "Acerca la carita de Pulsi a tu frente",
    detalle: "El sensor está en el ojo derecho de Pulsi. Mantenla 2 segundos.",
    animacion: "Pulsi inclinándose + haz saliendo del ojo derecho",
    icono: Thermometer,
  },
];

function HuecoAnimacion({ texto }: { texto: string }) {
  return (
    <div className="relative flex min-h-20 items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-nube/40 px-4 py-3 text-center">
      <span className="absolute left-3 top-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">
        Hueco de animación
      </span>
      <p className="mt-3 text-small font-semibold text-ink/60">{texto}</p>
    </div>
  );
}

/** Aro punteado sobre la zona que hay que tocar. */
function Zona({ x, y, rx, ry, activa }: { x: number; y: number; rx: number; ry: number; activa: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-dashed transition-colors",
        activa ? "border-ink/70 bg-lutea/25 animate-pulse" : "border-ink/25",
      )}
      style={{
        left: `${(x / 160) * 100}%`,
        top: `${(y / 170) * 100}%`,
        width: `${(rx * 2) / 160 * 100}%`,
        height: `${(ry * 2) / 170 * 100}%`,
      }}
    />
  );
}

function useSensores(simulando: boolean, paso: Paso) {
  const [lectura, setLectura] = useState<Lectura>({ bpm: null, fuerza: null, temperatura: null });

  useEffect(() => {
    if (!simulando) return;
    let tic = 0;
    const id = window.setInterval(() => {
      tic += 1;
      setLectura((prev) => {
        if (paso === 0) return { ...prev, bpm: 68 + Math.round(Math.sin(tic / 3) * 4) };
        if (paso === 1) return { ...prev, fuerza: Math.min(9.5, 1.2 + tic * 0.9) };
        return { ...prev, temperatura: 33.4 + Math.sin(tic / 4) * 0.3 };
      });
    }, 220);
    return () => window.clearInterval(id);
  }, [simulando, paso]);

  return lectura;
}

export function CapturaSensores() {
  const [paso, setPaso] = useState<Paso>(0);
  const [simulando, setSimulando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const lectura = useSensores(simulando && !terminado, paso);

  const actual = PASOS[paso];
  const Icono = actual.icono;

  const valor = useMemo(() => {
    if (paso === 0) return lectura.bpm ? `${lectura.bpm} bpm` : "—";
    if (paso === 1) return lectura.fuerza ? `${lectura.fuerza.toFixed(1)} kg` : "—";
    return lectura.temperatura ? `${lectura.temperatura.toFixed(1)} °C` : "—";
  }, [paso, lectura]);

  const listo = paso === 0 ? lectura.bpm !== null : paso === 1 ? lectura.fuerza !== null : lectura.temperatura !== null;

  const avanzar = useCallback(() => {
    if (!listo) return;
    if (paso < 2) {
      setPaso((p) => (p + 1) as Paso);
      setSimulando(false);
    } else {
      setTerminado(true);
    }
  }, [listo, paso]);

  if (terminado) {
    return (
      <Card tone="fase-suave" padding="lg" className="mx-auto w-full max-w-lg">
        <div className="flex items-center gap-3">
          <CheckCircle size={32} weight="fill" className="text-ink" />
          <div>
            <h2 className="font-display text-h3 font-bold text-ink">Listo</h2>
            <p className="text-small text-ink/70">Ya tenemos tus tres lecturas.</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            ["Pulso", `${lectura.bpm ?? 72} bpm`],
            ["Fuerza", `${(lectura.fuerza ?? 8.4).toFixed(1)} kg`],
            ["Temp.", `${(lectura.temperatura ?? 33.5).toFixed(1)} °C`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-nube/70 px-2 py-4">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/50">{k}</dt>
              <dd className="mt-1 font-display text-body-lg font-bold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <Button
          className="mt-6"
          fullWidth
          onClick={() => {
            setTerminado(false);
            setPaso(0);
            setSimulando(false);
          }}
        >
          Repetir
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      {/* progreso */}
      <div className="flex items-center gap-2" aria-label="Progreso">
        {PASOS.map((p, i) => (
          <span
            key={p.id}
            className={cx(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < paso ? "bg-ink" : i === paso ? "bg-ink/70" : "bg-ink/15",
            )}
          />
        ))}
      </div>

      <Card className="overflow-hidden" padding="lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">
            Paso {paso + 1} de 3
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rosa-claro px-3 py-1 text-small font-bold text-ink">
            <Icono size={15} weight="bold" />
            {actual.titulo}
          </span>
        </div>

        <h2 className="mt-3 font-display text-h3 font-bold leading-tight text-ink">{actual.instruccion}</h2>
        <p className="mt-1 text-small text-ink/65">{actual.detalle}</p>

        {/* Pulsi con la zona marcada */}
        <div className="relative mx-auto mt-5 w-[210px]">
          <Pulsi mood="feliz" size={210} wings animated />
          {paso === 0 && <Zona x={80} y={136} rx={24} ry={17} activa={simulando} />}
          {paso === 1 && (
            <>
              <Zona x={24} y={96} rx={24} ry={15} activa={simulando} />
              <Zona x={136} y={96} rx={24} ry={15} activa={simulando} />
            </>
          )}
          {paso === 2 && <Zona x={66} y={102} rx={15} ry={15} activa={simulando} />}
        </div>

        {/* lectura */}
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-crema px-4 py-3">
          <span className="text-small font-semibold text-ink/60">Lectura</span>
          <span className={cx("font-display text-body-lg font-bold tabular-nums", listo ? "text-ink" : "text-ink/30")}>
            {valor}
          </span>
        </div>

        <HuecoAnimacion texto={actual.animacion} />

        <div className="mt-4 flex gap-2">
          <Button variant="suave" onClick={() => setSimulando(true)} disabled={simulando}>
            {simulando ? "Leyendo…" : "Simular lectura"}
          </Button>
          <Button fullWidth onClick={avanzar} disabled={!listo}>
            {paso === 2 ? "Terminar" : "Continuar"}
          </Button>
        </div>
      </Card>

      <p className="text-center text-[11px] text-ink/45">
        Cuando el prototipo esté conectado, estos valores llegan del ESP32 por WebSocket. El botón de simular desaparece.
      </p>
    </div>
  );
}
