"use client";

import { Pulsi } from "@/components/mascot/Pulsi";
import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";

/** Full-screen wait while the session resolves; Pulsi breathes. */
export function LoadingScreen() {
  const { language } = useSession();
  return (
    <div role="status" className="grid min-h-svh place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-respirar">
          <Pulsi mood="feliz" size={96} color="var(--color-ovulatoria)" />
        </div>
        <p className="font-display text-body-lg font-semibold">{t(language, "app.cargando")}</p>
      </div>
    </div>
  );
}
