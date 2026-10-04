"use client";

import { Guard } from "@/components/session/Guard";
import { LegacyAthleteApp } from "@/components/legacy/LegacyAthleteApp";

export default function AthleteHomePage() {
  return (
    <Guard allow={["ATHLETE"]} requireProfile>
      <LegacyAthleteApp />
    </Guard>
  );
}
