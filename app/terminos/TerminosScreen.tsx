"use client";

import { LegalPage } from "@/components/legal/LegalPage";
import { TERMINOS } from "@/lib/legal";

export function TerminosScreen() {
  return <LegalPage doc={TERMINOS} />;
}
