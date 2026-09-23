"use client";

import { useCallback, useEffect, useState } from "react";

import {
  GENERAL_GROUPS,
  ISOLATED_GROUPS,
  RoutineEntry,
  RoutineResponse,
  generateRoutine,
} from "@/lib/api";
import { LANGUAGES, LANGUAGE_LABELS, Language, localized, muscleLabel, t } from "@/lib/i18n";

const MAX_GROUPS = 4;

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-teal-500"
      }`}
    >
      {label}
    </button>
  );
}

function RoutineCard({ entry, language }: { entry: RoutineEntry; language: Language }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {entry.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.image_url} alt={entry.exercise_original} className="h-40 w-full object-cover" />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800">{entry.exercise_original}</h3>
          {entry.impact && (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {entry.impact}
            </span>
          )}
        </div>

        {entry.blocked && (
          <div className="rounded border-l-4 border-red-400 bg-red-50 p-2 text-sm text-red-700">
            <strong>{t(language, "blocked")}:</strong> {entry.block_reason}
            {entry.exercise_substitute && (
              <div>
                {t(language, "substitute")}: <em>{entry.exercise_substitute}</em>
              </div>
            )}
          </div>
        )}

        {entry.description && (
          <p className="text-sm text-slate-600">{localized(entry.description, language)}</p>
        )}

        <div className="flex gap-4 text-sm text-slate-700">
          <span>
            {t(language, "sets")}: <strong>{entry.series_adapted}</strong>
          </span>
          <span>
            {t(language, "reps")}: <strong>{entry.reps_adapted}</strong>
          </span>
          <span>
            {t(language, "weight")}: <strong>{entry.weight_suggested_kg}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("EN");
  const [selected, setSelected] = useState<string[]>([]);
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGroup = (group: string) => {
    setSelected((current) => {
      if (current.includes(group)) {
        return current.filter((g) => g !== group);
      }
      if (current.length >= MAX_GROUPS) {
        return current;
      }
      return [...current, group];
    });
  };

  const runGeneration = useCallback(
    async (lang: Language, groups: string[]) => {
      if (groups.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        setRoutine(await generateRoutine(groups, lang));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const onGenerate = () => runGeneration(language, selected);

  const onChangeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (routine && selected.length > 0) {
      void runGeneration(lang, selected);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t(language, "title")}</h1>
          <p className="text-slate-600">{t(language, "subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{t(language, "language")}:</span>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => onChangeLanguage(lang)}
              className={`rounded px-2 py-1 text-sm ${
                language === lang ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </header>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-700">{t(language, "muscleGroups")}</h2>
        <p className="text-sm text-slate-500">{t(language, "selectHint")}</p>

        <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
          {t(language, "isolated")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {ISOLATED_GROUPS.map((group) => (
            <Chip
              key={group}
              label={muscleLabel(language, group)}
              active={selected.includes(group)}
              onClick={() => toggleGroup(group)}
            />
          ))}
        </div>

        <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
          {t(language, "general")}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {GENERAL_GROUPS.map((group) => (
            <Chip
              key={group}
              label={muscleLabel(language, group)}
              active={selected.includes(group)}
              onClick={() => toggleGroup(group)}
            />
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onGenerate}
            disabled={loading || selected.length === 0}
            className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? t(language, "generating") : t(language, "generate")}
          </button>
          <button
            onClick={() => {
              setSelected([]);
              setRoutine(null);
            }}
            className="rounded bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
          >
            {t(language, "clear")}
          </button>
        </div>
      </section>

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {t(language, "error")}: {error}
        </p>
      )}

      {routine && (
        <section className="mt-6">
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            {routine.phase_inferred && (
              <span>
                {t(language, "phase")}: <strong>{routine.phase_inferred}</strong>
              </span>
            )}
            {routine.fatigue_level && (
              <span>
                {t(language, "fatigue")}: <strong>{routine.fatigue_level}</strong>
              </span>
            )}
            {routine.k_load_multiplier != null && (
              <span>
                {t(language, "kLoad")}: <strong>{routine.k_load_multiplier.toFixed(3)}</strong>
              </span>
            )}
          </div>
          {routine.alerts.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
              {routine.alerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {routine.routine.map((entry, index) => (
              <RoutineCard key={entry.exercise_id ?? index} entry={entry} language={language} />
            ))}
          </div>
        </section>
      )}

      {!routine && !loading && !error && (
        <p className="mt-6 text-slate-500">{t(language, "noRoutine")}</p>
      )}
    </main>
  );
}
