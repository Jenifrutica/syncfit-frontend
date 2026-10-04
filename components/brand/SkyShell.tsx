import type { ReactNode } from "react";

import { cx } from "@/lib/cx";
import { Cloud } from "@/components/decor/Cloud";
import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Full-height pink sky with drifting clouds, the wordmark and an optional
 * right-side slot (language switcher). Used by sign-in and onboarding.
 */
export function SkyShell({ aside, children, className }: { aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("relative flex min-h-svh flex-col overflow-hidden", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Cloud className="absolute top-24 -left-16 text-nube/70 sm:left-[4%]" width={240} />
        <Cloud className="absolute top-[45%] -right-20 text-nube/60 sm:right-[6%]" width={200} />
        <Cloud className="absolute -bottom-6 left-[10%] text-nube/80 max-sm:hidden" width={320} />
      </div>
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
        <Wordmark />
        {aside}
      </header>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-4 pb-10 sm:pt-8">{children}</main>
    </div>
  );
}
