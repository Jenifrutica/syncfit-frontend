import { DRIP_PATHS } from "@/components/decor/DripDivider";
import { cx } from "@/lib/cx";

// The incoming section's shape: everything below the drip curve of DRIP_PATHS.gotea,
// reaching far down so a layer can rise without opening a gap above its section.
const SUBE = `M1440 30 ${DRIP_PATHS.gotea.split("L1440 30 ")[1].replace(/ Z$/, "")} L0 330 L1440 330 Z`;

/** Back to front: opacity of the section color, rise speed (depth), height and a mirror for variety. */
const LAYERS = [
  { mix: 40, depth: 1.6, mirror: true, tall: "h-24 sm:h-40" },
  { mix: 70, depth: 1, mirror: false, tall: "h-20 sm:h-32" },
  { mix: 100, depth: 0.4, mirror: false, tall: "h-16 sm:h-24" },
];

/**
 * Landing-only melting top edge of an incoming section. It sits right above the
 * section (bottom-full) and overlaps the end of the previous one; while
 * scrolling, its three layers rise at their own depth ([data-gota] in
 * useLandingMotion) and the previous section's content sinks under them
 * ([data-hunde]), so the old section seems to melt into the new one.
 * The section that renders it must be `relative` and above the previous one.
 * `color` is a CSS value: "var(--color-lavanda)", "var(--cielo)"…
 */
export function CapasGoteo({ color, className }: { color: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cx("pointer-events-none absolute inset-x-0 bottom-full -mb-px h-16 sm:h-24", className)}>
      {LAYERS.map((layer) => (
        <svg
          key={layer.mix}
          data-gota={layer.depth}
          viewBox="0 0 1440 110"
          preserveAspectRatio="none"
          className={cx("absolute inset-x-0 bottom-0 w-full overflow-visible", layer.tall, layer.mirror && "-scale-x-100", layer.mix < 100 && "motion-reduce:hidden")}
          style={{ color: layer.mix === 100 ? color : `color-mix(in oklab, ${color} ${layer.mix}%, transparent)` }}
        >
          <path d={SUBE} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
