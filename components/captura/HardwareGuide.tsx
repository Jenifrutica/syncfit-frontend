"use client";

import { CheckCircle, Plugs, WarningCircle } from "@phosphor-icons/react";

import { Card } from "@/components/ui/Card";
import { t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

type Props = {
  connected: boolean;
  ageSeconds?: number | null;
  deviceId?: string | null;
};

/** Connection status plus a short, printable bring-up guide for the prototype. */
export function HardwareGuide({ connected, ageSeconds, deviceId }: Props) {
  const { language } = useSession();
  const steps = [1, 2, 3, 4, 5, 6, 7, 8] as const;

  return (
    <Card padding="md" className="mt-4">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${
            connected ? "bg-exito-suave text-exito" : "bg-rosa-claro text-ink-suave"
          }`}
        >
          {connected ? <CheckCircle size={20} weight="bold" /> : <WarningCircle size={20} weight="bold" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-body-lg font-bold text-ink">
            {t(language, connected ? "captura.guia.conectado" : "captura.guia.sinConexion")}
          </p>
          <p className="mt-0.5 text-small font-semibold text-ink-suave">
            {connected
              ? tf(language, "captura.guia.hace", {
                  device: deviceId || "ESP32",
                  s: Math.round(ageSeconds ?? 0),
                })
              : t(language, "captura.guia.detalle")}
          </p>
        </div>
        <Plugs size={22} weight="bold" className="mt-1 shrink-0 text-ink/40" aria-hidden />
      </div>

      <details className="group mt-4 border-t border-linea/30 pt-3">
        <summary className="cursor-pointer list-none rounded-lg px-1 py-1 text-small font-extrabold text-ink underline underline-offset-4 marker:content-none">
          {t(language, "captura.guia.titulo")}
        </summary>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-small leading-relaxed text-ink-suave">
          {steps.map((step) => (
            <li key={step}>{t(language, `captura.guia.paso${step}`)}</li>
          ))}
        </ol>
        <p className="mt-3 rounded-xl bg-rosa-claro px-3 py-2 text-small font-semibold leading-relaxed text-ink-suave">
          {t(language, "captura.guia.pines")}
        </p>
      </details>
    </Card>
  );
}
