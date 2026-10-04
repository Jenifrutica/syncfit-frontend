import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

export type CardTone = "nube" | "crema" | "fase" | "fase-suave" | "lavanda" | "tinta" | "rosa-claro";

const TONES: Record<CardTone, string> = {
  nube: "bg-nube text-ink",
  crema: "bg-crema text-ink",
  fase: "bg-fase text-ink",
  "fase-suave": "bg-fase-suave text-ink",
  "rosa-claro": "bg-rosa-claro text-ink",
  lavanda: "sobre-oscuro bg-lavanda text-nube",
  tinta: "sobre-oscuro bg-ink text-nube",
};

export type CardProps = ComponentProps<"div"> & {
  tone?: CardTone;
  /** Soft lifted shadow; use for the one floating element of a group, not every card. */
  elevated?: boolean;
  padding?: "sm" | "md" | "lg";
};

/**
 * Rounded "cloud" surface. Separation comes from background + shadow, never borders.
 * Do not nest cards inside cards.
 */
export function Card({ tone = "nube", elevated = false, padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-nube",
        TONES[tone],
        elevated && "shadow-nube",
        padding === "sm" && "p-4",
        padding === "md" && "p-5 sm:p-6",
        padding === "lg" && "p-6 sm:p-10",
        className,
      )}
      {...rest}
    />
  );
}
