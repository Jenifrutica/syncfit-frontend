"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Barbell, Check, Drop, Leaf, Moon, Sun, type Icon } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { FASE_COLOR, faseLabel, isFase } from "@/lib/fases";
import { addDays, fromISODate, toISODate } from "@/lib/dates";
import { localized, t, type Language } from "@/lib/i18n";
import type { CalendarDay } from "@/lib/api";

export const KIND_ICON: Record<CalendarDay["kind"], Icon> = {
  CYCLE: Drop,
  OVULATION: Sun,
  STRENGTH: Barbell,
  LOW_IMPACT: Leaf,
  REST: Moon,
};

const LOCALE: Record<Language, string> = { ES: "es", EN: "en", ZH: "zh-CN" };

/**
 * One month as a 7-column grid; each day is tinted with its phase and shows
 * its kind icon and a check when the athlete trained. Arrow keys move the
 * focus (only the focused day is in the tab order).
 */
export function PhaseMonth({
  month,
  days,
  trained,
  today,
  selected,
  onSelect,
  language,
}: {
  month: string;
  days: CalendarDay[];
  trained: Set<string>;
  today: string;
  selected: string;
  onSelect: (date: string) => void;
  language: Language;
}) {
  const first = fromISODate(`${month}-01`);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const grid = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(selected.startsWith(month) ? selected : `${month}-01`);
  const moveFocus = useRef(false);

  useEffect(() => {
    setFocused(selected.startsWith(month) ? selected : `${month}-01`);
  }, [month, selected]);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  }, [focused]);

  const weekdayFormat = new Intl.DateTimeFormat(LOCALE[language], { weekday: "narrow" });
  const dayFormat = new Intl.DateTimeFormat(LOCALE[language], { weekday: "long", day: "numeric", month: "long" });

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(event.key in steps)) return;
    event.preventDefault();
    const next = toISODate(addDays(fromISODate(focused), steps[event.key]));
    if (!next.startsWith(month)) return;
    moveFocus.current = true;
    setFocused(next);
  };

  return (
    <div>
      <div aria-hidden="true" className="grid grid-cols-7 pb-2 text-center text-caption font-extrabold text-ink-suave">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i}>{weekdayFormat.format(new Date(2024, 0, 1 + i)).toUpperCase()}</span>
        ))}
      </div>
      <div ref={grid} className="grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`v-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const info = byDate.get(date);
          const fase = isFase(info?.phase) ? info.phase : null;
          const KindIcon = info ? KIND_ICON[info.kind] : null;
          const didTrain = trained.has(date);
          const isSelected = date === selected;
          const label = [
            dayFormat.format(fromISODate(date)),
            fase ? faseLabel(fase, language) : null,
            info?.label ? localized(info.label, language) : null,
            didTrain ? t(language, "cal.entrenaste") : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <button
              key={date}
              type="button"
              data-date={date}
              tabIndex={date === focused ? 0 : -1}
              aria-pressed={isSelected}
              aria-current={date === today ? "date" : undefined}
              aria-label={label}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(date)}
              onClick={() => onSelect(date)}
              style={{ background: isSelected ? undefined : fase ? FASE_COLOR[fase].suave : undefined }}
              className={cx(
                "relative flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 rounded-ficha font-display tabular-nums",
                "transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.94]",
                isSelected ? "bg-ink text-nube" : fase ? "text-ink" : "bg-nube/60 text-ink",
                date === today && !isSelected && "outline-3 outline-offset-1 outline-ink",
              )}
            >
              <span aria-hidden="true" className="text-body font-semibold leading-none">
                {i + 1}
              </span>
              {KindIcon && <KindIcon aria-hidden="true" size={14} weight="bold" />}
              {didTrain && (
                <span aria-hidden="true" className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-exito text-nube">
                  <Check size={12} weight="bold" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
