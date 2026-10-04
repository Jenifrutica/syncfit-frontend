import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

/** Pulsi's speech bubble (Paranice "Yummy, ¡Cookies!" style). The tail points to the speaker. */
export function SpeechBubble({ children, tail = "izquierda", tone = "tinta", className }: { children: ReactNode; tail?: "izquierda" | "abajo"; tone?: "tinta" | "nube"; className?: string }) {
  return (
    <p
      className={cx(
        "max-w-[16rem] px-4 py-2.5 font-display text-body font-semibold leading-snug",
        tone === "tinta" ? "bg-ink text-nube" : "bg-nube text-ink",
        tail === "izquierda" ? "rounded-[1.5rem_1.5rem_1.5rem_0.375rem]" : "rounded-[1.5rem_1.5rem_1.5rem_1.5rem]",
        className,
      )}
    >
      {children}
    </p>
  );
}
