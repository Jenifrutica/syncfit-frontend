import { cx } from "@/lib/cx";

const PATHS = {
  /** The section above "melts" down into the next one (drips hang from the top). */
  gotea:
    "M0 0 L1440 0 L1440 30 C1380 30 1370 78 1330 78 C1290 78 1300 26 1220 26 C1120 26 1100 60 1010 60 C960 60 966 86 930 86 C892 86 900 34 830 34 C720 34 700 64 600 64 C540 64 548 88 510 88 C472 88 480 28 400 28 C300 28 280 56 190 56 C140 56 150 80 110 80 C70 80 76 32 0 32 Z",
  /** The next section rises into the one above in soft scoops. */
  sube:
    "M0 50 C120 50 140 20 240 20 C330 20 340 92 380 92 C420 92 410 36 470 36 C560 36 600 70 700 70 C760 70 760 104 800 104 C842 104 830 48 900 48 C1000 48 1040 22 1130 22 C1200 22 1210 86 1250 86 C1290 86 1280 40 1340 40 C1400 40 1420 54 1440 54 L1440 110 L0 110 Z",
};

/**
 * Paranice-style melting edge between two sections.
 * - variant "gotea": path = color of the section ABOVE (text-*), background = section BELOW (bg-*).
 * - variant "sube": path = color of the section BELOW (text-*), background = section ABOVE (bg-*).
 */
export function DripDivider({ variant = "gotea", className }: { variant?: keyof typeof PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true" className={cx("relative -my-px block h-14 w-full sm:h-24", className)}>
      <path d={PATHS[variant]} fill="currentColor" />
    </svg>
  );
}
