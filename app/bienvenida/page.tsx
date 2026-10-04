import type { Metadata } from "next";

import { OnboardingScreen } from "./OnboardingScreen";

export const metadata: Metadata = { title: "Bienvenida" };

export default function BienvenidaPage() {
  return <OnboardingScreen />;
}
