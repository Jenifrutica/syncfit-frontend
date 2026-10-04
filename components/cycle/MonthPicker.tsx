"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { IconButton } from "@/components/ui/Button";
import type { Language } from "@/lib/i18n";
import { addDays, fromISODate, toISODate } from "@/lib/dates";

const LOCALE: Record<Language, string> = { ES: "es", EN: "en", ZH: "zh-CN" };

/**
 * Month grid date picker (Monday first). Arrow keys move by day/week,
 * PageUp/PageDown by month; only the focused day is in the tab order.
 * Days after `max` are disabled. `highlightDays` tints the days after the
 * chosen one (e.g. a typical period length).
 */
export function MonthPicker({
  value,
  onChange,
  max,
  language,
  highlightDays = 0,
  labels,
}: {
  value: string | null;
  onChange: (value: string) => void;
  max: string;
  language: Language;
  highlightDays?: number;
  labels: { previous: string; next: string };
}) {
  const maxDate = useMemo(() => fromISODate(max), [max]);
  const [focused, setFocused] = useState<Date>(() => (value ? fromISODate(value) : maxDate));
  const [month, setMonth] = useState<Date>(() => new Date(focused.getFullYear(), focused.getMonth(), 1));
  const grid = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);

  const locale = LOCALE[language];
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
  const dayLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFormat.format(new Date(2024, 0, 1 + i))); // 2024-01-01 is a Monday

  const leading = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const selected = value ? fromISODate(value) : null;
  const focusedISO = toISODate(focused);
  const canGoNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxDate;

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedISO}"]`)?.focus();
  }, [focusedISO, month]);

  const moveTo = (date: Date) => {
    const clamped = date > maxDate ? maxDate : date;
    shouldFocus.current = true;
    setFocused(clamped);
    setMonth(new Date(clamped.getFullYear(), clamped.getMonth(), 1));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in steps) {
      event.preventDefault();
      moveTo(addDays(focused, steps[event.key]));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const delta = event.key === "PageUp" ? -1 : 1;
      moveTo(new Date(focused.getFullYear(), focused.getMonth() + delta, Math.min(focused.getDate(), 28)));
    }
  };

  const showMonth = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth(next);
    setFocused(next > maxDate ? maxDate : next);
  };

  return (
    <div className="rounded-nube bg-nube p-3 sm:p-4">
      <div className="flex items-center justify-between pb-2">
        <IconButton label={labels.previous} variant="suave" onClick={() => showMonth(-1)}>
          <CaretLeft size={18} weight="bold" />
        </IconButton>
        <p aria-live="polite" className="font-display text-body-lg font-semibold first-letter:uppercase">
          {monthLabel}
        </p>
        <IconButton label={labels.next} variant="suave" onClick={() => showMonth(1)} disabled={!canGoNext}>
          <CaretRight size={18} weight="bold" />
        </IconButton>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 pb-1 text-center text-caption font-extrabold text-ink-suave">
        {weekdays.map((day, index) => (
          <span key={index}>{day.toUpperCase()}</span>
        ))}
      </div>
      <div ref={grid} className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`vacío-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const iso = toISODate(date);
          const isSelected = !!selected && iso === toISODate(selected);
          const offset = selected ? Math.round((date.getTime() - selected.getTime()) / 86_400_000) : -1;
          const inHighlight = offset > 0 && offset < highlightDays;
          const disabled = date > maxDate;
          return (
            <button
              key={iso}
              type="button"
              data-date={iso}
              tabIndex={iso === focusedISO ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={dayLabel.format(date)}
              disabled={disabled}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(date)}
              onClick={() => onChange(iso)}
              className={cx(
                "grid h-11 place-items-center font-display text-body font-semibold tabular-nums",
                "transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.92]",
                "disabled:opacity-35",
                isSelected
                  ? "rounded-full bg-ink text-nube"
                  : inHighlight
                    ? "rounded-campo bg-menstrual-suave text-ink"
                    : "rounded-full text-ink hover:bg-rosa-claro",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
