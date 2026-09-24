"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CatalogItem,
  EnergyLevel,
  GENERAL_GROUPS,
  ISOLATED_GROUPS,
  Profile,
  RoutineEntry,
  RoutineResponse,
  SupplementAdvice,
  generateRoutine,
  getCatalog,
  getSupplements,
  saveProfile,
} from "@/lib/api";
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  Language,
  OBJECTIVE_OPTIONS,
  localized,
  muscleLabel,
  objectiveLabel,
  t,
} from "@/lib/i18n";

const MAX_GROUPS = 4;

type Tab = "routine" | "supplements" | "profile";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2, 14);
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

function SetsSummary({ entry, language }: { entry: RoutineEntry; language: Language }) {
  const setsList = entry.sets;
  if (!setsList || setsList.length === 0) return null;
  const groups: Record<string, typeof setsList> = {};
  for (const set of setsList) {
    (groups[set.type] ||= []).push(set);
  }
  const labelFor = (type: string) =>
    type === "WARMUP"
      ? t(language, "warmup")
      : type === "APPROXIMATION"
        ? t(language, "approximation")
        : type === "EFFECTIVE"
          ? t(language, "effective")
          : type;
  return (
    <ul className="text-xs text-slate-600">
      {Object.entries(groups).map(([type, sets]) => (
        <li key={type}>
          <strong>{labelFor(type)}:</strong>{" "}
          {sets.length}×{sets[0].reps} @ {sets[0].weight_kg}kg · {sets[0].rest_seconds}s
        </li>
      ))}
    </ul>
  );
}

function RoutineCard({ entry, language }: { entry: RoutineEntry; language: Language }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {entry.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.image_url} alt={entry.exercise_original} className="h-36 w-full object-cover" />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800">{entry.exercise_original}</h3>
          {entry.impact && (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{entry.impact}</span>
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
        <SetsSummary entry={entry} language={language} />
        {entry.estimated_seconds != null && (
          <div className="text-xs text-slate-500">
            {t(language, "totalTime")}: {Math.round(entry.estimated_seconds / 60)} {t(language, "minutes")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("EN");
  const [tab, setTab] = useState<Tab>("routine");
  const [selected, setSelected] = useState<string[]>([]);
  const [exercisesCount, setExercisesCount] = useState(5);
  const [timeBudget, setTimeBudget] = useState<number | "">("");
  const [energy, setEnergy] = useState<EnergyLevel>("MODERATE");
  const [objective, setObjective] = useState<string>("HYPERTROPHY");
  const [modality, setModality] = useState<"MENSTRUAL_CYCLE" | "GESTATIONAL">("MENSTRUAL_CYCLE");
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [supplements, setSupplements] = useState<SupplementAdvice | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("syncfit-profile") : null;
    if (stored) {
      setProfile(JSON.parse(stored) as Profile);
    } else {
      const guest: Profile = {
        profile_id: uuid(),
        display_name: "Guest",
        language: "EN",
        is_guest: true,
        loads: [],
      };
      setProfile(guest);
    }
  }, []);

  useEffect(() => {
    getCatalog(language).then(setCatalog).catch(() => setCatalog([]));
  }, [language]);

  const loadVariation = routine?.variation_pct;

  const toggleGroup = (group: string) => {
    setSelected((current) =>
      current.includes(group)
        ? current.filter((g) => g !== group)
        : current.length >= MAX_GROUPS
          ? current
          : [...current, group],
    );
  };

  const runGeneration = useCallback(
    async (lang: Language, groups: string[]) => {
      if (groups.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        setRoutine(
          await generateRoutine(groups, lang, {
            exercisesCount,
            timeBudgetMinutes: timeBudget === "" ? undefined : Number(timeBudget),
            energy,
            objective,
            profileId: profile?.is_guest ? undefined : profile?.profile_id,
          }),
        );
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [exercisesCount, timeBudget, energy, objective, profile],
  );

  const loadSupplements = useCallback(async () => {
    setError(null);
    try {
      setSupplements(await getSupplements(modality, language, objective));
    } catch (err) {
      setError((err as Error).message);
    }
  }, [modality, language, objective]);

  useEffect(() => {
    if (tab === "supplements") void loadSupplements();
  }, [tab, loadSupplements]);

  const onChangeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (routine && selected.length > 0) void runGeneration(lang, selected);
  };

  const updateLoad = (exerciseId: string, weight: number) => {
    if (!profile) return;
    const loads = [...profile.loads];
    const index = loads.findIndex((l) => l.exercise_id === exerciseId);
    if (weight <= 0) {
      if (index >= 0) loads.splice(index, 1);
    } else if (index >= 0) {
      loads[index] = { ...loads[index], weight_kg: weight };
    } else {
      loads.push({ exercise_id: exerciseId, weight_kg: weight, reps: 10 });
    }
    setProfile({ ...profile, loads });
  };

  const onSaveProfile = async () => {
    if (!profile) return;
    setError(null);
    try {
      window.localStorage.setItem("syncfit-profile", JSON.stringify(profile));
      if (!profile.is_guest) {
        await saveProfile(profile).catch(() => null);
      }
      setSavedMsg(t(language, "saved"));
      setTimeout(() => setSavedMsg(null), 2000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadsById = useMemo(() => {
    const map: Record<string, number> = {};
    profile?.loads.forEach((load) => (map[load.exercise_id] = load.weight_kg));
    return map;
  }, [profile]);

  return (
    <main className="mx-auto max-w-6xl p-6">
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

      <nav className="mt-5 flex gap-2 border-b border-slate-200">
        {(["routine", "supplements", "profile"] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === item ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500"
            }`}
          >
            {item === "routine"
              ? t(language, "tabRoutine")
              : item === "supplements"
                ? t(language, "tabSupplements")
                : t(language, "tabProfile")}
          </button>
        ))}
      </nav>

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {t(language, "error")}: {error}
        </p>
      )}

      {tab === "routine" && (
        <section className="mt-5">
          <h2 className="font-semibold text-slate-700">{t(language, "muscleGroups")}</h2>
          <p className="text-sm text-slate-500">{t(language, "selectHint")}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{t(language, "isolated")}</p>
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
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{t(language, "general")}</p>
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

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="text-sm text-slate-600">
              {t(language, "exercisesCount")}
              <input
                type="number"
                min={1}
                max={12}
                value={exercisesCount}
                onChange={(e) => setExercisesCount(Number(e.target.value))}
                className="ml-2 w-16 rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              {t(language, "timeBudget")}
              <input
                type="number"
                min={10}
                max={180}
                placeholder={t(language, "noLimit")}
                value={timeBudget}
                onChange={(e) => setTimeBudget(e.target.value === "" ? "" : Number(e.target.value))}
                className="ml-2 w-24 rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="text-sm text-slate-600">
              {t(language, "energy")}
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value as EnergyLevel)}
                className="ml-2 rounded border border-slate-300 px-2 py-1"
              >
                <option value="ENERGY">{t(language, "energyEnergy")}</option>
                <option value="MODERATE">{t(language, "energyModerate")}</option>
                <option value="NO_ENERGY">{t(language, "energyNo")}</option>
              </select>
            </label>
            <button
              onClick={() => runGeneration(language, selected)}
              disabled={loading || selected.length === 0}
              className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? t(language, "generating") : t(language, "generate")}
            </button>
          </div>

          {routine && (
            <div className="mt-6">
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
                {routine.total_estimated_minutes != null && (
                  <span>
                    {t(language, "totalTime")}:{" "}
                    <strong>
                      {routine.total_estimated_minutes} {t(language, "minutes")}
                    </strong>
                  </span>
                )}
                {loadVariation != null && (
                  <span>
                    {t(language, "variation")}: <strong>{loadVariation}%</strong>
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

              {routine.warmup && routine.warmup.length > 0 && (
                <>
                  <h3 className="mt-4 font-semibold text-slate-700">{t(language, "warmup")}</h3>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {routine.warmup.map((entry, index) => (
                      <RoutineCard key={entry.exercise_id ?? index} entry={entry} language={language} />
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {routine.routine.map((entry, index) => (
                  <RoutineCard key={entry.exercise_id ?? index} entry={entry} language={language} />
                ))}
              </div>
            </div>
          )}
          {!routine && !loading && <p className="mt-6 text-slate-500">{t(language, "noRoutine")}</p>}
        </section>
      )}

      {tab === "supplements" && (
        <section className="mt-5">
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm text-slate-600">
              {t(language, "energy") /* reuse label spacing */}
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as "MENSTRUAL_CYCLE" | "GESTATIONAL")}
                className="ml-2 rounded border border-slate-300 px-2 py-1"
              >
                <option value="MENSTRUAL_CYCLE">Menstrual cycle</option>
                <option value="GESTATIONAL">Gestational</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              {t(language, "objective")}
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="ml-2 rounded border border-slate-300 px-2 py-1"
              >
                {OBJECTIVE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {objectiveLabel(language, opt)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={loadSupplements}
              className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
            >
              {t(language, "generate")}
            </button>
          </div>

          <h2 className="mt-5 font-semibold text-slate-700">{t(language, "supplementsFor")}</h2>
          {supplements && supplements.items.length === 0 && (
            <p className="mt-2 text-slate-500">{t(language, "noSupplements")}</p>
          )}
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supplements?.items.map((item) => {
              const colors =
                item.safety === "SAFE"
                  ? "bg-green-100 text-green-700"
                  : item.safety === "CAUTION"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700";
              const safetyLabel =
                item.safety === "SAFE"
                  ? t(language, "safe")
                  : item.safety === "CAUTION"
                    ? t(language, "caution")
                    : t(language, "avoid");
              return (
                <div key={item.supplement_id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{localized(item.name, language)}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs ${colors}`}>{safetyLabel}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{localized(item.reason, language)}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {t(language, "dosage")}: {localized(item.dosage, language)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t(language, "macros")}: {item.macros.protein_g}P / {item.macros.carbs_g}C /{" "}
                    {item.macros.fat_g}F · {item.macros.kcal} kcal
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "profile" && profile && (
        <section className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-semibold text-slate-700">{t(language, "profile")}</h2>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setProfile({ ...profile, is_guest: true })}
                className={`rounded px-3 py-1 text-sm ${
                  profile.is_guest ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {t(language, "guestMode")}
              </button>
              <button
                onClick={() => setProfile({ ...profile, is_guest: false })}
                className={`rounded px-3 py-1 text-sm ${
                  !profile.is_guest ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {t(language, "accountMode")}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-600">
                {t(language, "displayName")}
                <input
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                />
              </label>
              <div className="flex gap-4">
                <label className="block text-sm text-slate-600">
                  {t(language, "height")}
                  <input
                    type="number"
                    value={profile.height_cm ?? ""}
                    onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
                    className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
                  />
                </label>
                <label className="block text-sm text-slate-600">
                  {t(language, "weightKg")}
                  <input
                    type="number"
                    value={profile.weight_kg ?? ""}
                    onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
                    className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
                  />
                </label>
              </div>
              <label className="block text-sm text-slate-600">
                {t(language, "objective")}
                <select
                  value={profile.objective ?? "HYPERTROPHY"}
                  onChange={(e) => setProfile({ ...profile, objective: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                >
                  {OBJECTIVE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {objectiveLabel(language, opt)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={onSaveProfile}
                className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
              >
                {t(language, "save")}
              </button>
              {savedMsg && <span className="ml-2 text-sm text-green-700">{savedMsg}</span>}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-slate-700">{t(language, "myLoads")}</h2>
            <p className="text-sm text-slate-500">{t(language, "loadNote")}</p>
            <div className="mt-3 max-h-96 space-y-1 overflow-y-auto pr-1">
              {catalog.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-slate-700">{exercise.name}</span>
                  <input
                    type="number"
                    min={0}
                    value={loadsById[exercise.id] ?? ""}
                    onChange={(e) => updateLoad(exercise.id, Number(e.target.value))}
                    placeholder={t(language, "normalWeight")}
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
