"use client";

import { useEffect, useState } from "react";
import { Check } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Pulsi } from "@/components/mascot/Pulsi";
import { Spinner } from "@/components/ui/Spinner";
import { t, type Language } from "@/lib/i18n";

const STEPS = ["rutina.escaneo.sensor", "rutina.escaneo.local", "rutina.escaneo.generativa", "rutina.escaneo.validador"];

// A PPG-like beat, 64 units wide and ending at its start height; 16 beats
// fill 1024 units, so sliding by half (512) loops seamlessly.
const BEAT = "l10 0 4 -4 4 4 5 0 4 -28 5 50 5 -22 7 0 6 -6 8 6 6 0";
const WAVE = `M0 40 ${Array.from({ length: 16 }, () => BEAT).join(" ")}`;

/**
 * What happens server-side during POST /capture, shown as four stations
 * (sensor → local AI → generative AI → validator) while Pulsi breathes and a
 * pulse wave runs. The request is a single call, so stations advance on a
 * timer and all complete when the answer arrives.
 */
export function ScanProgress({ done, language }: { done: boolean; language: Language }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (done) {
      setActive(STEPS.length);
      return;
    }
    const id = window.setInterval(() => setActive((i) => Math.min(i + 1, STEPS.length - 1)), 900);
    return () => window.clearInterval(id);
  }, [done]);

  return (
    <div role="status" aria-live="polite" className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10 text-center">
      <div className="relative grid size-56 place-items-center">
        <div aria-hidden="true" className="absolute inset-0 animate-respirar rounded-full bg-fase-suave" />
        <div aria-hidden="true" className="absolute inset-6 animate-respirar rounded-full bg-fase/60 [animation-delay:-2s]" />
        <Pulsi mood="feliz" size={110} className="relative" />
      </div>

      <div aria-hidden="true" className="h-16 w-full overflow-hidden rounded-ficha bg-ink [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]">
        <svg viewBox="0 0 1024 80" preserveAspectRatio="none" className="h-full w-[200%] animate-onda">
          <path d={WAVE} fill="none" stroke="var(--color-fase)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t(language, "rutina.escaneo.titulo")}</h1>
        <p className="text-body font-bold text-ink-suave">{t(language, "rutina.escaneo.respira")}</p>
      </div>

      <ol className="flex w-full flex-col gap-2 text-left">
        {STEPS.map((key, index) => {
          const state = index < active ? "hecho" : index === active ? "ahora" : "luego";
          return (
            <li
              key={key}
              className={cx(
                "flex items-center gap-3 rounded-ficha px-4 py-3 font-display text-body font-semibold transition-opacity duration-[var(--dur-panel)]",
                state === "luego" ? "bg-nube/50 opacity-60" : "bg-nube",
              )}
            >
              <span aria-hidden="true" className={cx("grid size-8 shrink-0 place-items-center rounded-full", state === "hecho" ? "bg-exito-suave text-exito" : "bg-fase-suave")}>
                {state === "hecho" ? <Check size={18} weight="bold" aria-hidden="true" /> : state === "ahora" ? <Spinner size={18} /> : <span className="text-small">{index + 1}</span>}
              </span>
              {t(language, key)}
              {state !== "luego" && <span className="sr-only"> ({t(language, state === "hecho" ? "comun.hecho" : "comun.enCurso")})</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
