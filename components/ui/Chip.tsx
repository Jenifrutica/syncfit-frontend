import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/cx";

export type ChipProps = Omit<ComponentProps<"button">, "onChange"> & {
  selected: boolean;
  onToggle: () => void;
  icon?: ReactNode;
};

/** One-tap toggle (symptoms, muscle groups, energy). State is exposed with aria-pressed. */
export function Chip({ selected, onToggle, icon, className, children, type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      onClick={onToggle}
      className={cx(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-small font-extrabold",
        "transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.95]",
        "disabled:pointer-events-none disabled:opacity-50",
        selected ? "bg-ink text-nube" : "bg-rosa-claro text-ink hover:bg-lutea-suave",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export type BadgeTone = "nube" | "fase" | "exito" | "peligro" | "aviso" | "lavanda";

const BADGE_TONES: Record<BadgeTone, string> = {
  nube: "bg-nube text-ink",
  fase: "bg-fase-suave text-ink",
  exito: "bg-exito-suave text-exito",
  peligro: "bg-peligro-suave text-peligro",
  aviso: "bg-aviso-suave text-aviso",
  lavanda: "bg-lutea-suave text-ink",
};

/** Static label (role, state, counts). */
export function Badge({ tone = "nube", icon, className, children }: { tone?: BadgeTone; icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-extrabold", BADGE_TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
