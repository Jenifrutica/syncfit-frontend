import Link from "next/link";

import { Pulsi } from "@/components/mascot/Pulsi";

/** "syncfit" wordmark with a tiny Pulsi; links home. */
export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2 no-underline">
      <Pulsi size={34} mood="feliz" color="var(--color-ovulatoria)" />
      <span className="font-display text-h3 font-bold tracking-tight">syncfit</span>
    </Link>
  );
}
