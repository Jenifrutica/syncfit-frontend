import type { Metadata } from "next";

import { GimnasiosScreen } from "./GimnasiosScreen";

export const metadata: Metadata = { title: "Gimnasios" };

export default function GimnasiosPage() {
  return <GimnasiosScreen />;
}
