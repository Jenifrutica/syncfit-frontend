import { DRIP_PATHS } from "@/components/decor/DripDivider";
import { cx } from "@/lib/cx";

// Each layer reaches 30 units past its anchored edge, so it can slide with the
// scroll without opening a gap against the section it hangs from.
const EXTENDED = {
  gotea: DRIP_PATHS.gotea.replace("M0 0 L1440 0", "M0 -30 L1440 -30"),
  sube: DRIP_PATHS.sube.replace("L1440 110 L0 110 Z", "L1440 140 L0 140 Z"),
};

/** Back to front: how much of the edge color each layer has, its depth (scroll speed) and a mirror for variety. */
const LAYERS = [
  { mix: 35, speed: 1.6, mirror: true, tall: "h-20 sm:h-32" },
  { mix: 65, speed: 0.9, mirror: false, tall: "h-16 sm:h-28" },
  { mix: 100, speed: 0.3, mirror: false, tall: "h-14 sm:h-24" },
];

/**
 * Landing-only melting edge made of three overlapping drip layers that move at
 * different speeds while scrolling (parallax, driven by [data-gota] in
 * useLandingMotion). Back layers are tinted toward the other section's color.
 * - variant "gotea": `edge` is the section ABOVE (drips hang down), `base` the one below.
 * - variant "sube": `edge` is the section BELOW (scoops rise up), `base` the one above.
 * Colors are CSS values, e.g. "var(--cielo)" or "var(--color-lavanda)".
 */
export function CapasGoteo({ variant, edge, base, className }: { variant: "gotea" | "sube"; edge: string; base: string; className?: string }) {
  const top = variant === "gotea";
  return (
    <div aria-hidden="true" className={cx("relative -my-px h-20 overflow-hidden sm:h-32", className)} style={{ background: base }}>
      {LAYERS.map((layer) => (
        <svg
          key={layer.mix}
          data-gota={layer.speed}
          viewBox="0 0 1440 110"
          preserveAspectRatio="none"
          className={cx("absolute inset-x-0 w-full overflow-visible", top ? "top-0" : "bottom-0", layer.tall, layer.mirror && "-scale-x-100")}
          style={{ color: layer.mix === 100 ? edge : `color-mix(in oklab, ${edge} ${layer.mix}%, ${base})` }}
        >
          <path d={EXTENDED[variant]} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
