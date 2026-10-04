import type { Metadata } from "next";
import { Suspense } from "react";

import { EntrarScreen } from "./EntrarScreen";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarScreen />
    </Suspense>
  );
}
