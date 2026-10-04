"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/app/AppShell";
import { Guard } from "@/components/session/Guard";

export default function AthleteShellLayout({ children }: { children: ReactNode }) {
  return (
    <Guard allow={["ATHLETE"]} requireProfile>
      <AppShell>{children}</AppShell>
    </Guard>
  );
}
