import { Card } from "@/components/ui/Card";
import { t, tf, type Language } from "@/lib/i18n";

type Macros = { protein_g: number; carbs_g: number; fat_g: number; kcal: number };

const PARTS = [
  { key: "proteina", grams: (m: Macros) => m.protein_g, kcalPerGram: 4, color: "var(--color-folicular)" },
  { key: "carbos", grams: (m: Macros) => m.carbs_g, kcalPerGram: 4, color: "var(--color-ovulatoria)" },
  { key: "grasa", grams: (m: Macros) => m.fat_g, kcalPerGram: 9, color: "var(--color-lutea)" },
] as const;

/** Daily calories plus a labelled proportion bar of where they come from. */
export function MacrosCard({ macros, language }: { macros: Macros; language: Language }) {
  const energy = PARTS.map((part) => part.grams(macros) * part.kcalPerGram);
  const total = energy.reduce((a, b) => a + b, 0) || 1;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h3 font-bold">{t(language, "nutri.macros")}</h2>
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
    </Card>
  );
}
