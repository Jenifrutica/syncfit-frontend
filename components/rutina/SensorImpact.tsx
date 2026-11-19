"use client";

import { Barbell, Heartbeat, Thermometer, type Icon } from "@phosphor-icons/react";

import { Card } from "@/components/ui/Card";
import type { Readiness } from "@/lib/api";
import { cx } from "@/lib/cx";
import { t, tf, type Language } from "@/lib/i18n";

type Row = {
  key: string;
  icon: Icon;
  label: string;
  value: string | null;
  reference: string | null;
  factor: number;
  note?: string | null;
};

/**
 * How today's pulse, push and temperature changed the routine: each sensor
 * with today's value, the athlete's own reference and its effect, plus the
 * final load and the volume / rest / impact changes.
 */
export function SensorImpact({ readiness, language }: { readiness: Readiness; language: Language }) {
  const r = readiness;
  const rows: Row[] = [
    {
      key: "force",
      icon: Barbell,
      label: t(language, "sensores.fuerza"),
      value: r.peak_force_kg != null ? `${r.peak_force_kg.toFixed(1)} kg` : null,
      reference: r.strength_reference_kg != null ? tf(language, "sensores.mejorMarca", { n: r.strength_reference_kg.toFixed(1) }) : null,
      factor: r.force_factor,
      note: r.new_strength_record ? t(language, "sensores.record") : r.keep_max ? t(language, "sensores.mantienesMax") : null,
    },
    {
      key: "hr",
      icon: Heartbeat,
      label: t(language, "sensores.pulso"),
      value: r.heart_rate_bpm != null ? `${Math.round(r.heart_rate_bpm)} bpm` : null,
      reference: r.hr_baseline_bpm != null ? tf(language, "sensores.habitual", { v: `${Math.round(r.hr_baseline_bpm)} bpm` }) : null,
      factor: r.hr_factor,
    },
    {
      key: "temp",
      icon: Thermometer,
      label: t(language, "sensores.temperatura"),
      value: r.temperature_c != null ? `${r.temperature_c.toFixed(1)} °C` : null,
      reference: r.temp_baseline_c != null ? tf(language, "sensores.habitual", { v: `${r.temp_baseline_c.toFixed(1)} °C` }) : null,
      factor: r.temp_factor,
      note: r.fever ? t(language, "sensores.fiebre") : null,
    },
  ];
  const changes = [
    r.sets_delta > 0 ? tf(language, "sensores.menosSeries", { n: r.sets_delta }) : null,
    r.rest_extra_s > 0 ? tf(language, "sensores.masDescanso", { n: r.rest_extra_s }) : null,
    r.impact_cap ? t(language, `sensores.impacto.${r.impact_cap}`) : null,
  ].filter(Boolean) as string[];
  const pct = Math.round(r.load_multiplier * 100);

  return (
    <Card className="flex flex-col gap-4" data-sensor-impact>
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 font-bold">{t(language, "sensores.titulo")}</h2>
        <p className={cx("font-display text-h3 font-bold", r.keep_max ? "text-exito" : pct < 90 ? "text-peligro" : "text-ink")} data-load-percent={pct}>
          {r.keep_max ? t(language, "sensores.cargaMax") : tf(language, "sensores.carga", { n: pct })}
        </p>
        {r.source === "simulated" && <p className="text-small font-bold text-ink-suave">{t(language, "sensores.simulado")}</p>}
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map(({ key, icon: RowIcon, label, value, reference, factor, note }) => {
          const effect = value == null ? t(language, "sensores.sinDato") : factor >= 1 ? t(language, "sensores.sinCambio") : `−${Math.round((1 - factor) * 100)} %`;
          return (
            <li key={key} className="flex items-center gap-3 rounded-2xl bg-rosa-claro/60 px-3 py-2.5" data-sensor={key}>
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-nube">
                <RowIcon size={20} weight="bold" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-body font-bold">
                  {label} {value && <span className="tabular-nums">· {value}</span>}
                </p>
                <p className="text-small font-bold text-ink-suave">{[reference, note].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <span
                className={cx(
                  "shrink-0 rounded-full px-2.5 py-1 text-small font-extrabold tabular-nums",
                  value == null ? "bg-nube text-ink-suave" : factor >= 1 ? "bg-exito-suave text-exito" : "bg-peligro-suave text-peligro",
                )}
              >
                {effect}
              </span>
            </li>
          );
        })}
      </ul>
      {changes.length > 0 && (
        <p className="text-small font-bold" data-sensor-changes>
          {t(language, "sensores.ajustes")} {changes.join(" · ")}
        </p>
      )}
    </Card>
  );
}
