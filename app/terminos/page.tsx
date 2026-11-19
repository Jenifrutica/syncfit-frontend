import type { Metadata } from "next";

import { TerminosScreen } from "./TerminosScreen";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TerminosPage() {
  return <TerminosScreen />;
}
