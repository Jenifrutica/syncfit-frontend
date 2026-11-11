"use client";

import { CapturaSensores } from "@/components/captura/CapturaSensores";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/**
 * Public demo of the sensor check-in (no session required).
 * Inside the app the same flow lives at /app/checkin.
 */
export default function CapturaPage() {
  const { language } = useSession();

  return (
    <main className="min-h-dvh bg-nube px-5 py-10 text-ink">
      <header className="mx-auto mb-6 w-full max-w-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45">Check-in</p>
        <h1 className="mt-1 font-display text-h1 font-bold leading-tight">{t(language, "checkin.titulo")}</h1>
        <p className="mt-1 text-small text-ink/65">{t(language, "checkin.sub")}</p>
      </header>
      <CapturaSensores />
    </main>
  );
}
