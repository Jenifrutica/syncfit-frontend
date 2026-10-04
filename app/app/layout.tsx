"use client";

import type { ReactNode } from "react";

import { RoutineProvider } from "@/lib/routine-context";

/** Everything under /app shares today's routine (Rutina ↔ Entreno). */
export default function AthleteLayout({ children }: { children: ReactNode }) {
  return <RoutineProvider>{children}</RoutineProvider>;
}
