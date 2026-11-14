import type { Metadata } from "next";
import { Suspense } from "react";

import { RecuperarScreen } from "./RecuperarScreen";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <Suspense>
      <RecuperarScreen />
    </Suspense>
  );
}
