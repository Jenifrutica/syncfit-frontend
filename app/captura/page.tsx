import type { Metadata } from "next";

import { CapturaSensores } from "@/components/captura/CapturaSensores";

export const metadata: Metadata = { title: "Captura de sensores · SyncFit Edge" };

export default function CapturaPage() {
  return (
    <main className="min-h-dvh bg-nube px-5 py-10 text-ink">
      <header className="mx-auto mb-6 w-full max-w-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45">Check-in</p>
        <h1 className="mt-1 font-display text-h1 font-bold leading-tight">Toma de datos</h1>
        <p className="mt-1 text-small text-ink/65">Tres pasos, uno por sensor. Sigue a Pulsi.</p>
      </header>
      <CapturaSensores />
    </main>
  );
}
