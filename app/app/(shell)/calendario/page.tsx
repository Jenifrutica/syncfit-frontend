import type { Metadata } from "next";

import { CalendarioScreen } from "./CalendarioScreen";

export const metadata: Metadata = { title: "Calendario" };

export default function CalendarioPage() {
  return <CalendarioScreen />;
}
