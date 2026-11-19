"use client";

import { Cloud } from "@/components/decor/Cloud";
import { DripDivider } from "@/components/decor/DripDivider";
import { Pulsi } from "@/components/mascot/Pulsi";
import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";

/**
 * Full-screen wait while the session resolves, in the brand: pink sky with
 * drifting clouds, Pulsi flying inside a breathing halo of the phase color,
 * and the dripping edge at the bottom. Motion stops with reduced motion.
 */
export function LoadingScreen() {
  const { language } = useSession();
  return (
    <div role="status" className="relative grid min-h-svh place-items-center overflow-hidden bg-rosa">
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
        <p className="font-display text-h3 font-semibold">{t(language, "app.cargando")}</p>
      </div>

      <DripDivider variant="gotea" className="absolute inset-x-0 bottom-0 rotate-180 text-fase-suave" />
    </div>
  );
}
