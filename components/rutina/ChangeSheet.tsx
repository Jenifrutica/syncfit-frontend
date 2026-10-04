"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, MagnifyingGlass } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Field";
import { Skeleton, SkeletonGroup } from "@/components/ui/States";
import { getCatalog, getExerciseAlternatives, type CatalogItem, type ExerciseAlternative } from "@/lib/api";
import { t, type Language } from "@/lib/i18n";
import type { RoutineItem } from "@/lib/routine";

export type ExercisePick = { id: string; name: string; image_url?: string | null; description?: Record<string, string> };

/**
 * "Cambiar": ordered alternatives for the same movement (what's available at
 * the athlete's gym first), plus a search over the whole catalog.
 */
export function ChangeSheet({ item, language, onClose, onPick }: { item: RoutineItem | null; language: Language; onClose: () => void; onPick: (pick: ExercisePick) => void }) {
  const [alternatives, setAlternatives] = useState<ExerciseAlternative[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!item) return;
    setQuery("");
    setAlternatives(null);
    if (item.exerciseId) {
      getExerciseAlternatives(item.exerciseId, language).then(setAlternatives).catch(() => setAlternatives([]));
    } else {
      setAlternatives([]);
    }
    if (catalog.length === 0) getCatalog(language).then(setCatalog).catch(() => setCatalog([]));
  }, [item, language, catalog.length]);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return [];
    return catalog.filter((c) => c.name.toLocaleLowerCase().includes(q) && c.id !== item?.exerciseId).slice(0, 8);
  }, [catalog, query, item?.exerciseId]);

  const option = (key: string, name: string, extra: React.ReactNode, pick: ExercisePick) => (
    <li key={key}>
      <button
        type="button"
        onClick={() => onPick(pick)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-ficha bg-rosa-claro px-4 py-3 text-left transition-transform duration-[var(--dur-toque)] active:scale-[0.98] hover:bg-lutea-suave"
      >
        <span className="font-display text-body-lg font-semibold">{name}</span>
        {extra}
      </button>
    </li>
  );

  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      variant="sheet"
      title={t(language, "cambiar.titulo")}
      description={item ? `${item.name} · ${t(language, "cambiar.desc")}` : undefined}
      closeLabel={t(language, "comun.cerrar")}
    >
      {alternatives === null ? (
        <SkeletonGroup label={t(language, "cambiar.cargando")}>
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </SkeletonGroup>
      ) : alternatives.length === 0 ? (
        <p className="text-body text-ink-suave">{t(language, "cambiar.sinOpciones")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {alternatives.map((alt) =>
            option(
              alt.id,
              alt.name,
              alt.available ? (
                <Badge tone="exito" icon={<CheckCircle size={14} weight="bold" />}>
                  {t(language, "cambiar.disponible")}
                </Badge>
              ) : null,
              { id: alt.id, name: alt.name, image_url: alt.image_url },
            ),
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <label htmlFor="buscar-catalogo" className="text-small font-extrabold">
          {t(language, "cambiar.buscar")}
        </label>
        <div className="relative">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-suave" />
          <Input id="buscar-catalogo" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12" />
        </div>
        {query.trim() && (
          <ul aria-live="polite" className="flex flex-col gap-2">
            {results.length === 0 ? (
              <li className="text-small font-bold text-ink-suave">{t(language, "cambiar.sinResultados")}</li>
            ) : (
              results.map((c) => option(`cat-${c.id}`, c.name, <span className="text-caption font-extrabold text-ink-suave">{c.equipment}</span>, { id: c.id, name: c.name, image_url: c.image_url, description: { en: c.description } }))
            )}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
