"use client";

import { Choice } from "@/components/ui/Choice";
import { useSession } from "@/lib/session";
import { t, type Language } from "@/lib/i18n";

const ORDER: Language[] = ["ES", "EN", "ZH"];
const SHORT: Record<Language, string> = { ES: "ES", EN: "EN", ZH: "中文" };
const FULL: Record<Language, string> = { ES: "Español", EN: "English", ZH: "中文" };

/** ES · EN · 中文 — remembered across visits by the session. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useSession();
  return (
    <Choice
      legend={t(language, "comun.idioma")}
      hideLegend
      variant="segmentado"
      value={language}
      onChange={setLanguage}
      className={className}
      options={ORDER.map((lang) => ({
        value: lang,
        label: (
          <span lang={lang === "ZH" ? "zh-Hans" : lang.toLowerCase()} className="whitespace-nowrap">
            <span aria-hidden="true">{SHORT[lang]}</span>
            <span className="sr-only">{FULL[lang]}</span>
          </span>
        ),
      }))}
    />
  );
}
