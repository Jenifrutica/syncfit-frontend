"use client";

import { Guard } from "@/components/session/Guard";
import { LegacyAdmin } from "@/components/legacy/LegacyAdmin";

export default function GymAdminPage() {
  return (
    <Guard allow={["GYM_ADMIN"]}>
      <LegacyAdmin />
    </Guard>
  );
}
