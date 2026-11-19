"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowClockwise, WifiSlash } from "@phosphor-icons/react";

import { Pulsi } from "@/components/mascot/Pulsi";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { estadoServidor, leerServidor, leerServidorInicial, suscribirServidor } from "@/lib/servidor";

/**
 * Floating notice at the top of every page when the backend is slow (a cold
 * start, a bad connection) or cannot be reached. Hidden while calls answer
 * normally; it re-checks twice a second while something is pending.
 */
export function AvisoServidor() {
  const { language } = useSession();
  const { pendientes, caido } = useSyncExternalStore(suscribirServidor, leerServidor, leerServidorInicial);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (pendientes.length === 0) return;
    setAhora(Date.now());
    const id = window.setInterval(() => setAhora(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [pendientes]);

  const estado = estadoServidor(pendientes, ahora, caido);
  if (estado === "ok") return null;

  const titulo = estado === "caido" ? "servidor.caido" : estado === "muy-lento" ? "servidor.muyLento" : "servidor.lento";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <div
        role={estado === "caido" ? "alert" : "status"}
        aria-live="polite"
        data-aviso-servidor={estado}
        className={cx(
          "pointer-events-auto flex w-full max-w-md animate-aparecer items-center gap-3 rounded-nube px-4 py-3 shadow-nube",
          estado === "caido" ? "bg-peligro-suave" : "bg-nube",
        )}
      >
        <span aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center">
          <Pulsi mood={estado === "caido" ? "cansada" : "feliz"} size={44} animated={estado !== "caido"} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="flex items-center gap-2 font-display text-body font-semibold">
            {estado === "caido" ? <WifiSlash size={18} weight="bold" aria-hidden="true" /> : <Spinner size={16} />}
            {t(language, titulo)}
          </p>
          <p className="text-small font-bold text-ink-suave">{t(language, `${titulo}Desc`)}</p>
        </div>
        {estado === "caido" && (
          <Button variant="secundario" size="sm" icon={<ArrowClockwise size={16} weight="bold" />} onClick={() => window.location.reload()}>
            {t(language, "comun.reintentar")}
          </Button>
        )}
      </div>
    </div>
  );
}
