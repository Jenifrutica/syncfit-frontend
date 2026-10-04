"use client";

import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { useSession } from "@/lib/session";

/** Admin panels from before the redesign, fed by the session (phase 4 replaces them). */
export function LegacyAdmin() {
  const router = useRouter();
  const { user, language, setLanguage, signOut } = useSession();
  if (!user) return null;
  return (
    <AdminShell
      user={user}
      language={language}
      setLanguage={setLanguage}
      onLogout={() => {
        signOut();
        router.replace("/entrar");
      }}
    />
  );
}
