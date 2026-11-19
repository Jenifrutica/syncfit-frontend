"use client";

import { useEffect, useState } from "react";

import { Cloud } from "@/components/decor/Cloud";
import { DripDivider } from "@/components/decor/DripDivider";
import { Pulsi } from "@/components/mascot/Pulsi";
import { PuntosFase } from "@/components/ui/PuntosFase";
import { cx } from "@/lib/cx";
import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";

/**
 * Full-screen wait while the session resolves, in the brand: pink sky with
 * drifting clouds, Pulsi flying inside a breathing halo of the phase color,
 * and the dripping edge at the bottom. Motion stops with reduced motion.
 */
const FRASES = ["carga.frase1", "carga.frase2", "carga.frase3", "carga.frase4"];

export function LoadingScreen({ className }: { className?: string }) {
  const { language } = useSession();
  // A new short phrase every 2.4 s, so a longer wait still feels alive.
  const [frase, setFrase] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setFrase((i) => (i + 1) % FRASES.length), 2400);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div role="status" className={cx("relative grid min-h-svh place-items-center overflow-hidden bg-rosa", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Cloud className="absolute top-[12%] left-[6%] animate-deriva text-nube" width={180} />
        <Cloud className="absolute top-[28%] right-[4%] animate-deriva text-nube/80 [animation-delay:-5s]" width={140} />
        <Cloud className="absolute bottom-[22%] left-[14%] animate-deriva text-nube/70 [animation-delay:-9s]" width={120} />
      </div>

      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative grid size-48 place-items-center">
          <span aria-hidden="true" className="absolute inset-0 animate-respirar rounded-full bg-fase-suave" />
          <span aria-hidden="true" className="absolute inset-7 animate-respirar rounded-full bg-fase/50 [animation-delay:-3s]" />
          <Pulsi mood="feliz" size={96} wings animated className="relative" />
        </div>
        <PuntosFase />
        <div className="flex flex-col gap-1">
          <p className="font-display text-h3 font-semibold">{t(language, "app.cargando")}</p>
          <p key={frase} className="animate-aparecer text-body font-bold text-ink-suave" data-carga-frase>
            {t(language, FRASES[frase])}
          </p>
        </div>
      </div>

      <DripDivider variant="gotea" className="absolute inset-x-0 bottom-0 rotate-180 text-fase-suave" />
    </div>
  );
}
