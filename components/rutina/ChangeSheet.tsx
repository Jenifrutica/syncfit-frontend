"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle, MagnifyingGlass } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Field";
import { Skeleton, SkeletonGroup } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { getExerciseAlternatives, suggestExercise, type ExerciseAlternative, type ExerciseSuggestion, type LocalizedText } from "@/lib/api";
import { t, type Language } from "@/lib/i18n";
import type { RoutineItem } from "@/lib/routine";
import { useSession } from "@/lib/session";

export type ExercisePick = {
  id: string;
  name: string;
  image_url?: string | null;
  description?: Record<string, string>;
  setup?: LocalizedText | null;
  pregnancy_tip?: LocalizedText | null;
};

/**
 * "Cambiar": ordered alternatives for the same movement (what's available at
 * the athlete's gym first), plus a search over the whole catalog.
 */
export function ChangeSheet({ item, language, onClose, onPick }: { item: RoutineItem | null; language: Language; onClose: () => void; onPick: (pick: ExercisePick) => void }) {
  const { profile } = useSession();
  const blockSupine = profile?.modality === "GESTATIONAL" && (profile.timeline?.week ?? profile.gestation_week ?? 0) >= 16;
  const [alternatives, setAlternatives] = useState<ExerciseAlternative[] | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[] | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!item) return;
    setQuery("");
    setSuggestions(null);
    setAlternatives(null);
    if (item.exerciseId) {
      getExerciseAlternatives(item.exerciseId, language).then(setAlternatives).catch(() => setAlternatives([]));
    } else {
      setAlternatives([]);
    }
  }, [item, language]);

  // She types the exercise she has in mind; the backend ranks catalog
  // replacements (same movement pattern first) and explains each one.
  const ask = async (event: FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2 || !item?.exerciseId) return;
    setAsking(true);
    try {
      setSuggestions(await suggestExercise(item.exerciseId, text, language));
    } catch {
      setSuggestions([]);
    } finally {
      setAsking(false);
    }
  };

  const visibleAlternatives = (alternatives ?? []).filter((alt) => !blockSupine || !alt.supine);

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
      ) : visibleAlternatives.length === 0 ? (
        <p className="rounded-ficha bg-lutea/25 px-4 py-3 text-body font-bold" data-sin-alternativas>
          {t(language, "cambiar.sinRecomendado")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-alternativas>
          {visibleAlternatives.map((alt) =>
            option(
              alt.id,
              alt.name,
              alt.available ? (
                <Badge tone="exito" icon={<CheckCircle size={14} weight="bold" />}>
                  {t(language, "cambiar.disponible")}
                </Badge>
              ) : null,
              { id: alt.id, name: alt.name, image_url: alt.image_url, setup: alt.setup, pregnancy_tip: alt.pregnancy_tip },
            ),
          )}
        </ul>
      )}

      <form onSubmit={ask} className="flex flex-col gap-2 pt-2" data-sugerir>
        <label htmlFor="sugerir-ejercicio" className="text-small font-extrabold">
          {visibleAlternatives.length ? t(language, "cambiar.otroEnMente") : t(language, "cambiar.escribeloAqui")}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-suave" />
            <Input
              id="sugerir-ejercicio"
              type="search"
              value={query}
              maxLength={80}
              placeholder={t(language, "cambiar.ejemplo")}
              onChange={(e) => {
                setQuery(e.target.value);
                setSuggestions(null);
              }}
              className="pl-12"
            />
          </div>
          <Button type="submit" size="sm" loading={asking} disabled={query.trim().length < 2}>
            {t(language, "cambiar.sugerir")}
          </Button>
        </div>
        {suggestions !== null && (
          <ul aria-live="polite" className="flex flex-col gap-2" data-sugerencias>
            {suggestions.length === 0 ? (
              <li className="text-small font-bold text-ink-suave">{t(language, "cambiar.noEncontrado")}</li>
            ) : (
              suggestions.filter((sug) => !blockSupine || !sug.supine).map((sug) =>
                option(
                  `sug-${sug.id}`,
                  sug.name,
                  <span className="max-w-[45%] text-right text-caption font-extrabold text-ink-suave" data-fit={sug.fit}>{sug.reason}</span>,
                  { id: sug.id, name: sug.name, image_url: sug.image_url, setup: sug.setup, pregnancy_tip: sug.pregnancy_tip },
                ),
              )
            )}
          </ul>
        )}
      </form>
    </Dialog>
  );
}
