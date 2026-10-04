"use client";

import { Guard } from "@/components/session/Guard";
import { GymAdminScreen } from "@/components/paneles/GymAdminScreen";

export default function GymAdminPage() {
  return (
    <Guard allow={["GYM_ADMIN"]}>
      <GymAdminScreen />
    </Guard>
  );
}
