import type { Metadata } from "next";

import { PrivacidadScreen } from "./PrivacidadScreen";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return <PrivacidadScreen />;
}
