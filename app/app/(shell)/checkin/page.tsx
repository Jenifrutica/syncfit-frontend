"use client";

import { useRouter } from "next/navigation";

import { CapturaSensores } from "@/components/captura/CapturaSensores";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/** Sensor check-in inside the athlete app: verify, then go build the routine. */
export default function CheckinPage() {
  const router = useRouter();
  const { language } = useSession();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 sm:px-8 lg:pt-10">
      <header className="mx-auto mb-6 w-full max-w-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45">Check-in</p>
        <h1 className="mt-1 font-display text-h1 font-bold leading-tight">{t(language, "checkin.titulo")}</h1>
        <p className="mt-1 text-small text-ink/65">{t(language, "checkin.sub")}</p>
      </header>
      <CapturaSensores onDone={() => router.push("/app/rutina?checkin=1")} />
    </div>
  );
}
