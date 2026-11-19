"use client";

import { LegalPage } from "@/components/legal/LegalPage";
import { PRIVACIDAD } from "@/lib/legal";

export function PrivacidadScreen() {
  return <LegalPage doc={PRIVACIDAD} />;
}
