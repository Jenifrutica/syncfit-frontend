import { DRIP_PATHS } from "@/components/decor/DripDivider";
import { Pulsi } from "@/components/mascot/Pulsi";
import { cx } from "@/lib/cx";

// The incoming section's shape: everything below the drip curve of DRIP_PATHS.gotea,
// reaching far down so a layer can rise without opening a gap above its section.
const CURVA = DRIP_PATHS.gotea.split("L1440 30 ")[1].replace(/ Z$/, "");
const SUBE = `M1440 30 ${CURVA} L0 330 L1440 330 Z`;
// Gloss: the same curve as an open line, drawn a little inside the front layer.
const BRILLO = `M1440 30 ${CURVA}`;

/** Back to front: rise speed (depth), height and a mirror for variety. Colors come from `capas`. */
const LAYERS = [
  { depth: 1.6, mirror: true, tall: "h-24 sm:h-40" },
  { depth: 1, mirror: false, tall: "h-20 sm:h-32" },
  { depth: 0.4, mirror: false, tall: "h-16 sm:h-24" },
];

/**
 * Landing-only melting top edge of an incoming section. It sits right above the
 * section (bottom-full) and overlaps the end of the previous one; while
 * scrolling, its three solid layers rise at their own depth ([data-gota] in
 * useLandingMotion) and the previous section's content sinks under them
 * ([data-hunde]), so the old section seems to melt into the new one.
 * The box is tall and clips at the section's top, so layers can rise inside it
 * while their long tails never paint over the section's own content.
 * The section that renders it must be `relative` and above the previous one.
 * `capas` are three CSS colors, back to front; the front one is the section's own color.
 * `surfista` puts a winged Pulsi of that color riding the front wave.
 */
export function CapasGoteo({ capas, surfista, className }: { capas: readonly [string, string, string]; surfista?: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cx("pointer-events-none absolute inset-x-0 bottom-full -mb-px h-72 overflow-hidden sm:h-96", className)}>
      {LAYERS.map((layer, i) => (
        <svg
          key={i}
          data-gota={layer.depth}
          viewBox="0 0 1440 110"
          preserveAspectRatio="none"
          className={cx("absolute inset-x-0 bottom-0 w-full overflow-visible", layer.tall, layer.mirror && "-scale-x-100", i < LAYERS.length - 1 && "motion-reduce:hidden")}
          style={{ color: capas[i] }}
        >
          <path d={SUBE} fill="currentColor" />
          {i === LAYERS.length - 1 && (
            <path d={BRILLO} transform="translate(0 9)" fill="none" stroke={`color-mix(in oklab, ${capas[i]} 55%, white)`} strokeWidth={5} strokeLinecap="round" strokeDasharray="160 60 24 60" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
      ))}
      {surfista && (
        // Same box and depth as the front layer, so Pulsi rides its crest (x = 400 of 1440, y = 28 of 110).
        <div data-gota={LAYERS[LAYERS.length - 1].depth} className={cx("absolute inset-x-0 bottom-0 motion-reduce:hidden", LAYERS[LAYERS.length - 1].tall)}>
          <span className="absolute bottom-[72%] left-[27.8%] -translate-x-1/2 animate-flotar">
            <Pulsi size={56} wings color={surfista} />
          </span>
        </div>
      )}
    </div>
  );
}
