import type { ReactNode } from "react";

import { cx } from "@/lib/cx";
import { Card, type CardTone } from "@/components/ui/Card";

/**
 * Short "why" card (Flo insights / Headspace tips): an icon, a one-line
 * headline and an optional sentence. Explains the AI in plain words.
 */
export function StoryCard({
  tone = "lavanda",
  icon,
  title,
  children,
  className,
}: {
  tone?: CardTone;
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card tone={tone} padding="sm" className={cx("flex w-60 shrink-0 flex-col gap-2", className)}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <p className="font-display text-body-lg leading-tight font-semibold">{title}</p>
      {children && <p className="text-small font-bold opacity-90">{children}</p>}
    </Card>
  );
}
