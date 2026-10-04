import { cx } from "@/lib/cx";

export type PulsiMood = "feliz" | "cansada" | "alerta" | "dormida";

export type PulsiProps = {
  mood?: PulsiMood;
  /** Body color; defaults to the current phase color (data-fase on an ancestor). */
  color?: string;
  size?: number;
  wings?: boolean;
  /** Gentle float + blink. Disabled automatically under prefers-reduced-motion. */
  animated?: boolean;
  /** Accessible name; omit when Pulsi is decorative. */
  title?: string;
  className?: string;
};

const INK = "#2a1d65";
const BODY = "M80 8 C80 8 133 70 133 104 A53 53 0 0 1 27 104 C27 70 80 8 80 8 Z";
const WING_TILT: Record<PulsiMood, number> = { feliz: 28, cansada: 10, alerta: 40, dormida: -8 };

/**
 * Pulsi — the SyncFit guide: a heart-drop with a face that mirrors the
 * athlete's state (energy, fatigue, alerts, rest).
 */
export function Pulsi({ mood = "feliz", color = "var(--color-fase)", size = 120, wings = false, animated = false, title, className }: PulsiProps) {
  const tilt = WING_TILT[mood];
  const blink = animated && (mood === "feliz" || mood === "alerta");

  return (
    <svg
      viewBox="0 0 160 170"
      width={size}
      height={Math.round((size * 170) / 160)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cx("shrink-0 overflow-visible", animated && "animate-flotar", className)}
    >
      {wings && (
        <g fill="#fffafc" stroke={INK} strokeWidth="4">
          <ellipse cx="24" cy="96" rx="22" ry="12" transform={`rotate(${-tilt} 24 96)`} />
          <ellipse cx="136" cy="96" rx="22" ry="12" transform={`rotate(${tilt} 136 96)`} />
        </g>
      )}
      <rect x="60" y="148" width="11" height="17" rx="5.5" fill={INK} />
      <rect x="89" y="148" width="11" height="17" rx="5.5" fill={INK} />
      <path d={BODY} style={{ fill: color }} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="57" cy="70" rx="6" ry="11" fill="#fffafc" opacity="0.6" />
      {(mood === "feliz" || mood === "dormida") && (
        <g fill="#e86f7e" opacity="0.5">
          <ellipse cx="54" cy="120" rx="9" ry="5" />
          <ellipse cx="106" cy="120" rx="9" ry="5" />
        </g>
      )}
      <g
        className={blink ? "animate-parpadeo" : undefined}
        style={blink ? { transformBox: "fill-box", transformOrigin: "center" } : undefined}
      >
        <Eyes mood={mood} />
      </g>
      <Mouth mood={mood} />
      {mood === "cansada" && (
        <path d="M124 52 C124 52 134 65 134 71 A10 10 0 0 1 114 71 C114 65 124 52 124 52 Z" fill="#a8ddf2" stroke={INK} strokeWidth="3.5" />
      )}
      {mood === "dormida" && (
        <g fill={INK} fontFamily="var(--font-display)" fontWeight="700">
          <text x="118" y="44" fontSize="22">z</text>
          <text x="134" y="26" fontSize="16">z</text>
        </g>
      )}
    </svg>
  );
}

function Eyes({ mood }: { mood: PulsiMood }) {
  const stroke = { fill: "none", stroke: INK, strokeWidth: 5, strokeLinecap: "round" as const };
  switch (mood) {
    case "feliz":
      return (
        <g fill={INK}>
          <ellipse cx="66" cy="102" rx="5.5" ry="8.5" />
          <ellipse cx="94" cy="102" rx="5.5" ry="8.5" />
        </g>
      );
    case "cansada":
      return (
        <g {...stroke}>
          <path d="M57 101 Q66 107 75 101" />
          <path d="M85 101 Q94 107 103 101" />
        </g>
      );
    case "alerta":
      return (
        <g>
          <path d="M55 84 L72 88 M105 84 L88 88" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="65" cy="102" r="10" fill="#fffafc" stroke={INK} strokeWidth="4" />
          <circle cx="95" cy="102" r="10" fill="#fffafc" stroke={INK} strokeWidth="4" />
          <circle cx="66" cy="103" r="4.5" fill={INK} />
          <circle cx="96" cy="103" r="4.5" fill={INK} />
        </g>
      );
    case "dormida":
      return (
        <g {...stroke}>
          <path d="M57 100 Q66 94 75 100" />
          <path d="M85 100 Q94 94 103 100" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: PulsiMood }) {
  switch (mood) {
    case "feliz":
      return <path d="M68 120 Q80 134 92 120" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />;
    case "cansada":
      return <path d="M71 124 Q80 120 89 124" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />;
    case "alerta":
      return <ellipse cx="80" cy="127" rx="6" ry="7" fill={INK} />;
    case "dormida":
      return <ellipse cx="80" cy="124" rx="5" ry="4" fill={INK} />;
  }
}
