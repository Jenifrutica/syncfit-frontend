"use client";

import { cx } from "@/lib/cx";
import { FASE_COLOR, type Fase } from "@/lib/fases";

export type WeekDay = {
  key: string;
  weekday: string;
  day: number;
  fase?: Fase;
  /** Full accessible name, e.g. "Sábado 3, fase ovulatoria". */
  label: string;
};

/** Seven tappable days with a phase dot (Flo-style). */
export function WeekStrip({ days, selected, onSelect, className }: { days: WeekDay[]; selected: string; onSelect: (key: string) => void; className?: string }) {
  return (
    <div className={cx("grid grid-cols-7 gap-1", className)}>
      {days.map((day) => {
        const active = day.key === selected;
        return (
          <button
            key={day.key}
            type="button"
            aria-pressed={active}
            aria-label={day.label}
            onClick={() => onSelect(day.key)}
            className={cx(
              "flex min-h-16 flex-col items-center gap-0.5 rounded-ficha pt-2 pb-1.5",
              "transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.94]",
              active ? "bg-ink text-nube" : "bg-nube/70 text-ink hover:bg-nube",
            )}
          >
            <span aria-hidden="true" className="text-caption font-extrabold opacity-85">
              {day.weekday}
            </span>
            <span aria-hidden="true" className="font-display text-body-lg font-semibold tabular-nums">
              {day.day}
            </span>
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: day.fase ? FASE_COLOR[day.fase].base : "transparent" }}
            />
          </button>
        );
      })}
    </div>
  );
}
