import type { ReactNode } from "react";

import { cx } from "@/lib/cx";
import { FASE_COLOR, type Fase } from "@/lib/fases";

export type CycleSegment = { fase: Fase; length: number };

const R = 100;
const STROKE = 22;
const CIRC = 2 * Math.PI * R;
const GAP = 4;

/**
 * Flo-style ring: the cycle (days) or the pregnancy (weeks) as colored arcs,
 * with a marker on today. The center holds Pulsi and the headline numbers.
 */
export function CycleRing({
  segments,
  position,
  label,
  size = 240,
  children,
  className,
}: {
  segments: CycleSegment[];
  /** 1-based current day or week. */
  position: number;
  /** Full sentence for screen readers, e.g. "Día 14 de 28, fase ovulatoria". */
  label: string;
  size?: number;
  children?: ReactNode;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.length, 0) || 1;
  let start = 0;
  const arcs = segments.map((segment) => {
    const length = (segment.length / total) * CIRC;
    const arc = { fase: segment.fase, dash: Math.max(0, length - GAP), offset: -start };
    start += length;
    return arc;
  });

  const clamped = Math.min(Math.max(position, 1), total);
  const angle = ((clamped - 0.5) / total) * 2 * Math.PI;
  const markerX = 120 + R * Math.sin(angle);
  const markerY = 120 - R * Math.cos(angle);

  return (
    <div role="img" aria-label={label} className={cx("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 240 240" width={size} height={size} aria-hidden="true">
        <g transform="rotate(-90 120 120)">
          {arcs.map((arc, index) => (
            <circle
              key={index}
              cx="120"
              cy="120"
              r={R}
              fill="none"
              stroke={FASE_COLOR[arc.fase].base}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.dash} ${CIRC}`}
              strokeDashoffset={arc.offset}
            />
          ))}
        </g>
        <circle cx="120" cy="120" r={R - STROKE / 2 - 3} fill="#fffafc" />
        <circle cx={markerX} cy={markerY} r="15" fill="#fffafc" stroke="#2a1d65" strokeWidth="5" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
