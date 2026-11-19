import Link from "next/link";

import { Pulsi } from "@/components/mascot/Pulsi";
import { cx } from "@/lib/cx";

/**
 * "syncfit" wordmark with a tiny Pulsi; links home. `compact` keeps only Pulsi
 * on phones (the name stays for screen readers) to free room in tight headers.
 */
export function Wordmark({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2 no-underline">
      <Pulsi size={34} mood="feliz" color="var(--color-ovulatoria)" />
      <span className={cx("font-display text-h3 font-bold tracking-tight", compact && "max-sm:sr-only")}>syncfit</span>
    </Link>
  );
}
