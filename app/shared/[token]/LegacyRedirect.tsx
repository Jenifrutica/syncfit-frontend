"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Sends links created before the redesign (/shared/<token>) to /compartido/<token>. */
export function LegacyRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = pathname.split("/").filter(Boolean)[1];
    if (token && token !== "_") router.replace(`/compartido/${token}/`);
  }, [pathname, router]);

  return null;
}
