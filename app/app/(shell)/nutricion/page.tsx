import type { Metadata } from "next";

import { NutricionScreen } from "./NutricionScreen";

export const metadata: Metadata = { title: "Nutrición" };

export default function NutricionPage() {
  return <NutricionScreen />;
}
