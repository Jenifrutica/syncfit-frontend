"use client";

import { Guard } from "@/components/session/Guard";
import { LegacyAdmin } from "@/components/legacy/LegacyAdmin";

export default function SuperAdminPage() {
  return (
    <Guard allow={["SUPER_ADMIN"]}>
      <LegacyAdmin />
    </Guard>
  );
}
