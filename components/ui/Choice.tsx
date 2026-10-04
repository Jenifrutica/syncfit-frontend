"use client";

import { useId, type ReactNode } from "react";

import { cx } from "@/lib/cx";

export type ChoiceOption<T extends string> = {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
};

/**
 * Single-choice group built on native radios (arrow keys, form semantics for
 * free), styled as big tappable cards, compact pills or a segmented control.
 */
export function Choice<T extends string>({
  legend,
  hideLegend = false,
  options,
  value,
  onChange,
  variant = "tarjetas",
  columns,
  className,
}: {
  legend: ReactNode;
  hideLegend?: boolean;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  variant?: "tarjetas" | "pildoras" | "segmentado";
  columns?: 2 | 3 | 4 | 5 | 7;
  className?: string;
}) {
  const name = useId();

  const layout =
    variant === "segmentado"
      ? "grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-nube/70 p-1"
      : variant === "pildoras"
        ? cx("grid gap-2", columns === 7 ? "grid-cols-7" : columns === 5 ? "grid-cols-5" : columns === 4 ? "grid-cols-4" : "grid-cols-3")
        : cx("grid gap-3", columns === 2 ? "sm:grid-cols-2" : "");

  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className={cx(hideLegend ? "sr-only" : "mb-3 text-small font-extrabold")}>{legend}</legend>
      <div className={layout}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cx(
                "relative select-none transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.97]",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink",
                variant === "tarjetas" && "flex items-center gap-4 rounded-ficha p-4 sm:p-5",
                variant === "pildoras" && "grid min-h-12 place-items-center rounded-full font-display text-body-lg font-semibold",
                variant === "segmentado" && "grid min-h-11 place-items-center whitespace-nowrap rounded-full px-3 font-display text-button font-semibold",
                checked
                  ? variant === "segmentado"
                    ? "bg-ink text-nube shadow-boton"
                    : "bg-ink text-nube"
                  : variant === "segmentado"
                    ? "text-ink hover:bg-nube"
                    : "bg-nube text-ink hover:bg-rosa-claro",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.icon && <span aria-hidden="true" className="shrink-0">{option.icon}</span>}
              {variant === "tarjetas" ? (
                <span className="flex flex-col gap-0.5">
                  <span className="font-display text-h3 font-semibold">{option.label}</span>
                  {option.description && (
                    <span className={cx("text-small font-bold", checked ? "text-lavanda-texto" : "text-ink-suave")}>{option.description}</span>
                  )}
                </span>
              ) : (
                option.label
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
