/** Inline SVG icons (no emoji). All use currentColor. */

type Props = { className?: string; size?: number };

function base(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const };
}

export function Flower({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.5">
        <path d="M12 9.5c0-3 1-4.5 2-4.5s1.5 1.5.5 4" />
        <path d="M12 9.5c-2-2.2-3.5-2.8-4.3-2s.2 2.3 2.3 3.1" />
        <path d="M12 9.5c-2.8.2-4.2 1-4.1 2s1.8 1.3 4 .7" />
        <path d="M12 14.5c0 3-1 4.5-2 4.5s-1.5-1.5-.5-4" />
        <path d="M12 14.5c2 2.2 3.5 2.8 4.3 2s-.2-2.3-2.3-3.1" />
        <path d="M12 14.5c2.8-.2 4.2-1 4.1-2s-1.8-1.3-4-.7" />
      </g>
    </svg>
  );
}

export function Heart({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path
        d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.5 12 20 12 20z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Flame({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path
        d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.5.6-2.6 1.5-3.7.4 1 .9 1.6 1.6 2 .2-2.4.9-4.6 1.9-7.3z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Dumbbell({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6.5 8v8M4 9.5v5M17.5 8v8M20 9.5v5M6.5 12h11" />
      </g>
    </svg>
  );
}

export function Check({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Pill({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <rect x="3" y="9" width="18" height="6.5" rx="3.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9v6.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function Search({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Leaf({ className, size = 18 }: Props) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M5 19c0-7 5-12 14-13 1 9-4 14-11 14-1 0-2 0-3-1z" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 16c2-3 5-5 8-6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
