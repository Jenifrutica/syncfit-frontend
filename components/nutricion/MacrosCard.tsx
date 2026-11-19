import { Card } from "@/components/ui/Card";
import { t, tf, type Language } from "@/lib/i18n";

export type Macros = { protein_g: number; carbs_g: number; fat_g: number; kcal: number };

export type SupplementMacros = {
  /** Sum of one serving of each supplement in the athlete's list. */
  total: Macros;
  /** How many supplements add macros. */
  count: number;
  /** True when at least one value is the catalog average (not entered by her). */
  estimated: boolean;
};

const PARTS = [
  { key: "proteina", grams: (m: Macros) => m.protein_g, kcalPerGram: 4, color: "var(--color-folicular)" },
  { key: "carbos", grams: (m: Macros) => m.carbs_g, kcalPerGram: 4, color: "var(--color-ovulatoria)" },
  { key: "grasa", grams: (m: Macros) => m.fat_g, kcalPerGram: 9, color: "var(--color-lutea)" },
] as const;

/**
 * The daily macro target ("Macros meta") and, below it, a comparison bar with
 * what the athlete's supplements add, drawn on the same scale as the target.
 */
export function MacrosCard({ macros, language, supplements }: { macros: Macros; language: Language; supplements?: SupplementMacros | null }) {
  const energy = PARTS.map((part) => part.grams(macros) * part.kcalPerGram);
  const total = energy.reduce((a, b) => a + b, 0) || 1;

  const suppEnergy = supplements ? PARTS.map((part) => part.grams(supplements.total) * part.kcalPerGram) : [];
  const suppKcal = supplements ? Math.round(supplements.total.kcal || suppEnergy.reduce((a, b) => a + b, 0)) : 0;
  const share = (grams: number, goal: number) => (goal > 0 ? Math.round((grams / goal) * 100) : 0);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h3 font-bold">{t(language, "nutri.macrosMeta")}</h2>
        <p className="font-display text-h2 font-bold tabular-nums">{tf(language, "nutri.kcal", { n: Math.round(macros.kcal) })}</p>
      </div>
      <div aria-hidden="true" className="flex h-4 overflow-hidden rounded-full bg-rosa-claro">
        {PARTS.map((part, i) => (
          <span key={part.key} style={{ width: `${(energy[i] / total) * 100}%`, background: part.color }} />
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {PARTS.map((part, i) => (
          <li key={part.key} className="flex items-center justify-between gap-3 rounded-ficha bg-rosa-claro px-4 py-3 sm:flex-col sm:items-start sm:gap-0.5 sm:p-3">
            <span className="flex items-center gap-2 text-small font-extrabold">
              <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: part.color }} />
              {t(language, `nutri.${part.key}`)}
            </span>
            <span className="flex items-baseline gap-2 sm:flex-col sm:gap-0">
              <span className="font-display text-h3 font-bold tabular-nums">{tf(language, "nutri.gramos", { n: Math.round(part.grams(macros)) })}</span>
              <span className="text-caption font-extrabold text-ink-suave tabular-nums">{Math.round((energy[i] / total) * 100)} %</span>
            </span>
          </li>
        ))}
      </ul>

      {supplements && supplements.count > 0 && (
        <section aria-labelledby="macros-suplementos" className="flex flex-col gap-2 border-t border-rosa-claro pt-4" data-macros-suplementos>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="macros-suplementos" className="font-display text-body-lg font-bold">{t(language, "nutri.macrosSuplementos")}</h3>
            <p className="font-display text-body-lg font-bold tabular-nums">
              {tf(language, "nutri.kcal", { n: suppKcal })}
              <span className="ml-1 text-small text-ink-suave">· {tf(language, "nutri.deTuMeta", { n: share(suppKcal, macros.kcal) })}</span>
            </p>
          </div>
          {/* Same scale as the target bar: the filled part is what supplements cover. */}
          <div
            className="flex h-3 overflow-hidden rounded-full bg-rosa-claro"
            role="img"
            aria-label={tf(language, "nutri.deTuMeta", { n: share(suppKcal, macros.kcal) })}
          >
            {PARTS.map((part, i) => (
              <span key={part.key} style={{ width: `${Math.min((suppEnergy[i] / total) * 100, 100)}%`, background: part.color }} />
            ))}
          </div>
          <p className="text-small font-bold text-ink-suave">
            {PARTS.map((part) => `${t(language, `nutri.${part.key}`)} ${Math.round(part.grams(supplements.total))} g (${share(part.grams(supplements.total), part.grams(macros))} %)`).join(" · ")}
          </p>
          {supplements.estimated && <p className="text-caption font-bold text-ink-suave">{t(language, "nutri.estimado")}</p>}
        </section>
      )}
    </Card>
  );
}
