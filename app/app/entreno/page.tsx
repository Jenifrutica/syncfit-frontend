"use client";

import { Guard } from "@/components/session/Guard";
import { WorkoutScreen } from "@/components/entreno/WorkoutScreen";

export default function EntrenoPage() {
  return (
    <Guard allow={["ATHLETE"]} requireProfile>
      <WorkoutScreen />
    </Guard>
  );
}
