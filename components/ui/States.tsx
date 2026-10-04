import type { ReactNode } from "react";

import { cx } from "@/lib/cx";
import { Pulsi, type PulsiMood } from "@/components/mascot/Pulsi";

/** Placeholder block while data loads. Wrap a group in <SkeletonGroup>. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("animate-pulse rounded-ficha bg-lutea-suave", className)} />;
}

export function SkeletonGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={cx("flex flex-col gap-3", className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Branded empty / error state: Pulsi + what this is + the next action. */
export function EmptyState({
  mood = "dormida",
  title,
  description,
  action,
  className,
}: {
  mood?: PulsiMood;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center gap-3 px-4 py-8 text-center", className)}>
      <Pulsi mood={mood} size={96} animated />
      <h3 className="text-h3 font-bold">{title}</h3>
      {description && <p className="max-w-sm text-body text-ink-suave">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Determinate progress (onboarding steps, workout). */
export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cx("h-3 overflow-hidden rounded-full bg-lutea-suave", className)}
    >
      <div
        className="h-full origin-left rounded-full bg-ink transition-transform duration-[var(--dur-panel)] ease-[var(--ease-salida)]"
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  );
}
