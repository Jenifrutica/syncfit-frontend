import type { Metadata } from "next";

import { RutinaScreen } from "./RutinaScreen";

export const metadata: Metadata = { title: "Rutina" };

export default function RutinaPage() {
  return <RutinaScreen />;
}
