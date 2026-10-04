"use client";

import { useState } from "react";
import { Minus, Plus } from "@phosphor-icons/react";

import { IconButton } from "@/components/ui/Button";

/** Big number with − / + (cycle length, pregnancy week). Typing is allowed; the value is clamped on blur. */
export function NumberStepper({
  id,
  label,
  value,
  onChange,
  min,
  max,
  unit,
  decreaseLabel,
  increaseLabel,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));

  return (
    <div className="flex items-center justify-center gap-5">
      <IconButton label={decreaseLabel} size="lg" variant="secundario" disabled={value <= min} onClick={() => onChange(clamp(value - 1))}>
        <Minus size={24} weight="bold" />
      </IconButton>
      <div className="flex flex-col items-center">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft ?? value}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const parsed = Number(draft);
            if (draft !== null && draft !== "" && Number.isFinite(parsed)) onChange(clamp(parsed));
            setDraft(null);
          }}
          className="w-32 appearance-none bg-transparent text-center font-display text-display font-bold tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="font-display text-body-lg font-semibold text-ink-suave">{unit}</span>
      </div>
      <IconButton label={increaseLabel} size="lg" variant="secundario" disabled={value >= max} onClick={() => onChange(clamp(value + 1))}>
        <Plus size={24} weight="bold" />
      </IconButton>
    </div>
  );
}
