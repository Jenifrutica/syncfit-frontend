"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { homeFor, useSession, type Role } from "@/lib/session";
import { LoadingScreen } from "@/components/session/LoadingScreen";

/**
 * Client-side route guard (the token lives in localStorage).
 * - no session → /entrar?next=<this path>
 * - wrong role → that person's home
 * - athlete without profile (when required) → /bienvenida
 */
export function Guard({ allow, requireProfile = false, children }: { allow: Role[]; requireProfile?: boolean; children: ReactNode }) {
  const { status, user, profile } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const redirect =
    status === "anon"
      ? `/entrar?next=${encodeURIComponent(pathname)}`
      : status === "ready" && user && !allow.includes(user.role)
        ? homeFor(user, profile)
        : status === "ready" && requireProfile && !profile
          ? "/bienvenida"
          : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (status === "loading" || redirect) return <LoadingScreen />;
  return <>{children}</>;
}
