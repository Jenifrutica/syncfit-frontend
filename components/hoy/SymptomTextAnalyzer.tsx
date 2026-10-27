"use client";

import { useState } from "react";
import { Sparkle, WarningOctagon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/Field";
import { analyzeSymptoms, type SymptomAnalysis } from "@/lib/api";
import { t, tf, type Language } from "@/lib/i18n";

/**
 * Free-text symptoms + AI interpretation. The parent owns the text and the
 * analysis so it can merge detected ids and save everything together.
 */
export function SymptomTextAnalyzer({
  language,
  text,
  onTextChange,
  analysis,
  onAnalysisChange,
  painLevel,
  disabled = false,
}: {
  language: Language;
  text: string;
  onTextChange: (value: string) => void;
  analysis: SymptomAnalysis | null;
  onAnalysisChange: (value: SymptomAnalysis | null) => void;
  painLevel?: number;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onAnalysisChange(await analyzeSymptoms({ text, language, painLevel }));
    } catch {
      onAnalysisChange(null);
      setError(t(language, "sintomas.iaError"));
    } finally {
      setBusy(false);
    }
  };

  const change = (value: string) => {
    onTextChange(value);
    if (analysis) onAnalysisChange(null);
    if (error) setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="sintomas-texto" className="text-small font-extrabold">
        {t(language, "sintomas.texto")}
      </label>
      <TextArea
        id="sintomas-texto"
        rows={3}
        value={text}
        maxLength={1000}
        onChange={(event) => change(event.target.value)}
        placeholder={t(language, "sintomas.texto.ayuda")}
        disabled={disabled}
      />
      <Button
        variant="suave"
        size="sm"
        className="self-start"
        icon={<Sparkle size={16} weight="bold" />}
        loading={busy}
        loadingLabel={t(language, "sintomas.analizando")}
        disabled={disabled || !text.trim()}
        onClick={() => void run()}
      >
        {t(language, "sintomas.analizar")}
      </Button>

      {error && (
        <p role="alert" className="text-small font-bold text-peligro">
          {error}
        </p>
      )}

      {analysis && (
        <div aria-live="polite" className="flex flex-col gap-2 rounded-ficha bg-fase-suave/60 p-3">
          {analysis.matched.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-caption font-extrabold text-ink-suave">{t(language, "sintomas.detectado")}</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matched.map((item) => (
                  <Badge key={item.id} tone="fase">
                    {item.name}
                  </Badge>
                ))}
              </div>
              <ul className="flex flex-col gap-1">
                {analysis.matched.map((item) => (
                  <li key={item.id} className="text-small font-bold text-ink-suave">
                    <span className="text-ink">{item.name}:</span> {item.advice}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.guidance && <p className="text-small font-bold">{analysis.guidance}</p>}
          {analysis.avoid_patterns.length > 0 && (
            <p className="text-small font-bold text-ink-suave">
              {tf(language, "sintomas.evitar", {
                lista: analysis.avoid_patterns.map((pattern) => t(language, `patron.${pattern}`)).join(", "),
              })}
            </p>
          )}
          {analysis.block_training && (
            <p role="alert" className="flex items-start gap-2 text-small font-bold text-peligro">
              <WarningOctagon size={20} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
              {t(language, "sintomas.bloqueo")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
