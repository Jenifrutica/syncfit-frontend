import { cx } from "@/lib/cx";

export const CLOUD_PATH =
  "M40 100 C14 100 4 78 18 64 C8 44 30 26 52 36 C56 14 92 6 106 28 C122 10 160 18 158 46 C186 46 196 76 176 90 C170 100 160 100 150 100 Z";

/** Decorative cloud; color comes from `text-*` (fill = currentColor). */
export function Cloud({ className, width = 200 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 200 110" width={width} height={Math.round((width * 110) / 200)} aria-hidden="true" className={cx("shrink-0", className)}>
      <path d={CLOUD_PATH} fill="currentColor" />
    </svg>
  );
}
