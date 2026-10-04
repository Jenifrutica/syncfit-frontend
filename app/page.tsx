"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingScreen } from "@/components/session/LoadingScreen";
import { homeFor, useSession } from "@/lib/session";

/** Sends each person to the right place. Phase 5 turns this into the public landing. */
export default function RootPage() {
  const { status, user, profile } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "anon") router.replace("/entrar");
    if (status === "ready" && user) router.replace(homeFor(user, profile));
  }, [status, user, profile, router]);

  return <LoadingScreen />;
}
