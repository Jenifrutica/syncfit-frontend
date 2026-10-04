"use client";

import { Guard } from "@/components/session/Guard";
import { SuperAdminScreen } from "@/components/paneles/SuperAdminScreen";

export default function SuperAdminPage() {
  return (
    <Guard allow={["SUPER_ADMIN"]}>
      <SuperAdminScreen />
    </Guard>
  );
}
