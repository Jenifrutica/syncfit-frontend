import { cx } from "@/lib/cx";

const COLORES = ["bg-menstrual", "bg-folicular", "bg-ovulatoria", "bg-lutea"];

/**
 * Brand loading indicator: the four phase colors hopping in turn. Decorative
 * (aria-hidden); pair it with a visible or sr-only text in a role="status".
 */
export function PuntosFase({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("inline-flex items-end gap-1.5", className)} style={{ height: size + 10 }}>
      {COLORES.map((color, i) => (
        <span
          key={color}
          className={cx("animate-rebote rounded-full", color)}
          style={{ width: size, height: size, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
