"use client";

import { useEffect, useState } from "react";

import { getOptions, type AppOptions, type OptionItem } from "@/lib/api";
import type { Language } from "@/lib/i18n";

/**
 * Selectable values (muscle groups, objectives, goal phases) come from the database
 * through GET /options. The response carries the label in every language, so it is
 * fetched once per page load and shared by every screen.
 */
let cache: AppOptions | null = null;
let pending: Promise<AppOptions> | null = null;

function load(): Promise<AppOptions> {
  if (cache) return Promise.resolve(cache);
  pending ??= getOptions()
    .then((options) => (cache = options))
    .finally(() => {
      pending = null;
    });
  return pending;
}

export type OptionsState = {
  /** Options of a category in display order; empty until loaded. */
  list: (category: string) => OptionItem[];
  /** Label of a value in the given language (the raw value while unknown). */
  label: (category: string, value: string, language: Language) => string;
  loading: boolean;
  failed: boolean;
  retry: () => void;
};

export function useOptions(): OptionsState {
  const [options, setOptions] = useState<AppOptions | null>(cache);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    setFailed(false);
    load()
      .then((loaded) => !cancelled && setOptions(loaded))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return {
    list: (category) => options?.[category] ?? [],
    label: (category, value, language) => {
      const item = options?.[category]?.find((option) => option.value === value);
      return item?.labels[language.toLowerCase()] ?? item?.labels.en ?? value.replace(/_/g, " ");
    },
    loading: !options && !failed,
    failed,
    retry: () => setAttempt((n) => n + 1),
  };
}
