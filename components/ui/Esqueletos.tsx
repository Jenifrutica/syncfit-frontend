import { Skeleton } from "@/components/ui/States";
import { cx } from "@/lib/cx";

/*
 * Skeletons shaped like the real cards, so the layout does not jump when the
 * data arrives. All are decorative: wrap them in <SkeletonGroup label="…">.
 */

/** A card: optional round icon, a title line and a few text lines. */
export function EsqueletoTarjeta({ lineas = 2, icono = true, className }: { lineas?: number; icono?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={cx("flex gap-4 rounded-nube bg-nube p-5 shadow-nube", className)}>
      {icono && <Skeleton className="size-12 shrink-0 rounded-full" />}
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <Skeleton className="h-5 w-1/2" />
        {Array.from({ length: lineas }, (_, i) => (
          <Skeleton key={i} className={cx("h-3.5", i === lineas - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

/** Rows of a list or table: a round avatar and two lines each. */
export function EsqueletoLista({ filas = 4, className }: { filas?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cx("flex flex-col gap-2", className)}>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-ficha bg-rosa-claro p-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A month grid: weekday row and 35 day cells. */
export function EsqueletoMes({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("flex flex-col gap-2", className)}>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="mx-auto h-3 w-6" />)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="aspect-square min-h-11" />)}
      </div>
    </div>
  );
}

/** A row of chips (muscle groups, symptoms…). */
export function EsqueletoChips({ cantidad = 6, className }: { cantidad?: number; className?: string }) {
  const anchos = ["w-20", "w-28", "w-24", "w-16", "w-32", "w-24"];
  return (
    <div aria-hidden="true" className={cx("flex flex-wrap gap-2", className)}>
      {Array.from({ length: cantidad }, (_, i) => <Skeleton key={i} className={cx("h-11 rounded-full", anchos[i % anchos.length])} />)}
    </div>
  );
}
