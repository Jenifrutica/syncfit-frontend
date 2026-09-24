"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AuthUser,
  CaptureResult,
  CatalogItem,
  MyProfile,
  RoutineEntry,
  SupplementAdvice,
  capture,
  getCatalog,
  getMe,
  getMyProfile,
  getSupplements,
  login,
  logoutLocal,
  register,
  updateMyProfile,
} from "@/lib/api";
import {
  ISOLATED_GROUPS,
  GENERAL_GROUPS,
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

type Tab = "routine" | "supplements" | "profile";

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function SetsSummary({ entry, language }: { entry: RoutineEntry; language: Language }) {
  const sets = entry.sets;
  if (!sets || sets.length === 0) return null;
  const groups: Record<string, typeof sets> = {};
  for (const set of sets) (groups[set.type] ||= []).push(set);
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
      {Object.entries(groups).map(([type, list]) => (
        <li key={type}>
          <strong>{labelFor(type)}:</strong> {list.length}×{list[0].reps} @ {list[0].weight_kg}kg ·{" "}
          {list[0].rest_seconds}s
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
      </div>
    </div>
  );
}

function adapt(entry: Record<string, unknown>): RoutineEntry {
  return {
    exercise_original: String(entry.name ?? entry.exercise_original ?? ""),
    blocked: Boolean(entry.blocked),
    block_reason: String(entry.block_reason ?? ""),
    exercise_substitute: String(entry.substitute ?? entry.exercise_substitute ?? ""),
    series_adapted: Number(entry.series ?? 3),
    reps_adapted: Number(entry.reps ?? 10),
    weight_suggested_kg: Number(entry.weight_suggested_kg ?? 0),
    exercise_id: entry.exercise_id as string | undefined,
    role: entry.role as string | undefined,
    description: (entry.description as Record<string, string>) ?? undefined,
    image_url: entry.image_url as string | undefined,
    sets: entry.sets as RoutineEntry["sets"],
  };
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("EN");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("routine");
  const [selected, setSelected] = useState<string[]>([]);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [supplements, setSupplements] = useState<SupplementAdvice | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // auth form
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // onboarding form
  const [form, setForm] = useState<Record<string, unknown>>({
    modality: "MENSTRUAL_CYCLE",
    cycle_length_days: 28,
    objective: "HYPERTROPHY",
    loads: [],
  });

  useEffect(() => {
    (async () => {
      const me = await getMe().catch(() => null);
      setUser(me);
      if (me) setProfile(await getMyProfile().catch(() => null));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    getCatalog(language).then(setCatalog).catch(() => setCatalog([]));
  }, [language]);

  const onAuth = async () => {
    setError(null);
    try {
      const me =
        mode === "login" ? await login(email, password) : await register(email, password, name);
      setUser(me);
      setProfile(await getMyProfile().catch(() => null));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onLogout = () => {
    logoutLocal();
    setUser(null);
    setProfile(null);
    setCaptureResult(null);
  };

  const onSaveOnboarding = async () => {
    setError(null);
    setLoading(true);
    try {
      const saved = await updateMyProfile({ ...form, language });
      setProfile(saved);
      setTab("routine");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onTakeData = async () => {
    setError(null);
    setLoading(true);
    try {
      setCaptureResult(await capture(selected.length ? selected.join(",") : undefined));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplements = useCallback(async () => {
    setError(null);
    try {
      setSupplements(
        await getSupplements(
          (profile?.modality as "MENSTRUAL_CYCLE" | "GESTATIONAL") ?? "MENSTRUAL_CYCLE",
          language,
          profile?.objective ?? undefined,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, [profile, language]);

  useEffect(() => {
    if (tab === "supplements" && user && profile) void loadSupplements();
  }, [tab, user, profile, loadSupplements]);

  const loadsById = useMemo(() => {
    const map: Record<string, number> = {};
    profile?.loads.forEach((l) => (map[l.exercise_id] = l.weight_kg));
    return map;
  }, [profile]);

  if (!ready) return <main className="p-8 text-slate-500">…</main>;

  if (!user) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-3xl font-bold text-slate-800">{t(language, "title")}</h1>
        <p className="text-slate-600">{t(language, "subtitle")}</p>
        <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("login")}
              className={`rounded px-3 py-1 text-sm ${mode === "login" ? "bg-slate-800 text-white" : "bg-slate-100"}`}
            >
              {t(language, "signIn")}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`rounded px-3 py-1 text-sm ${mode === "register" ? "bg-slate-800 text-white" : "bg-slate-100"}`}
            >
              {t(language, "signUp")}
            </button>
          </div>
          {mode === "register" && (
            <input
              placeholder={t(language, "nameField")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          )}
          <input
            placeholder={t(language, "email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
          <input
            type="password"
            placeholder={t(language, "password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
          <button onClick={onAuth} className="w-full rounded bg-teal-600 px-4 py-2 text-white">
            {mode === "login" ? t(language, "signIn") : t(language, "signUp")}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`rounded px-2 py-1 text-sm ${language === lang ? "bg-slate-800 text-white" : "bg-slate-100"}`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-800">{t(language, "setupTitle")}</h1>
        <div className="mt-5 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <label className="block text-sm text-slate-600">
            Modality
            <select
              value={String(form.modality)}
              onChange={(e) => setForm({ ...form, modality: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            >
              <option value="MENSTRUAL_CYCLE">Menstrual cycle</option>
              <option value="GESTATIONAL">Gestational</option>
            </select>
          </label>
          <div className="flex gap-4">
            <label className="block text-sm text-slate-600">
              {t(language, "height")}
              <input
                type="number"
                value={String(form.height_cm ?? "")}
                onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })}
                className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="block text-sm text-slate-600">
              {t(language, "weightKg")}
              <input
                type="number"
                value={String(form.weight_kg ?? "")}
                onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })}
                className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
              />
            </label>
          </div>
          <label className="block text-sm text-slate-600">
            {t(language, "objective")}
            <select
              value={String(form.objective)}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            >
              {OBJECTIVE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {objectiveLabel(language, opt)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-600">
            Last period / LMP date
            <input
              type="date"
              value={String(form.last_period_date ?? "")}
              onChange={(e) => setForm({ ...form, last_period_date: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          {form.modality === "MENSTRUAL_CYCLE" ? (
            <label className="block text-sm text-slate-600">
              Cycle length (days)
              <input
                type="number"
                value={String(form.cycle_length_days ?? 28)}
                onChange={(e) => setForm({ ...form, cycle_length_days: Number(e.target.value) })}
                className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
              />
            </label>
          ) : (
            <label className="block text-sm text-slate-600">
              Gestation week
              <input
                type="number"
                value={String(form.gestation_week ?? "")}
                onChange={(e) => setForm({ ...form, gestation_week: Number(e.target.value) })}
                className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
              />
            </label>
          )}
          <button
            onClick={onSaveOnboarding}
            disabled={loading}
            className="rounded bg-teal-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? t(language, "generating") : t(language, "saveContinue")}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </main>
    );
  }

  const timeline = profile.timeline;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t(language, "welcome")}, {user.display_name}
          </h1>
          <p className="text-slate-600">
            {timeline
              ? timeline.modality === "GESTATIONAL"
                ? `Gestation · ${t(language, "cycleToday")} ${timeline.week}`
                : `${t(language, "cycleToday")} ${timeline.cycle_day} · ${timeline.phase}`
              : t(language, "noProfileYet")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`rounded px-2 py-1 text-sm ${language === lang ? "bg-slate-800 text-white" : "bg-slate-100"}`}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
          <button onClick={onLogout} className="rounded bg-slate-200 px-3 py-1 text-sm">
            {t(language, "logout")}
          </button>
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

      {error && <p className="mt-4 text-sm text-red-600">{t(language, "error")}: {error}</p>}

      {tab === "routine" && (
        <section className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onTakeData}
              disabled={loading}
              className="rounded bg-teal-600 px-5 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? t(language, "capturing") : t(language, "takeData")}
            </button>
            <span className="text-sm text-slate-500">{t(language, "selectHint")}</span>
          </div>

          <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{t(language, "isolated")}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {ISOLATED_GROUPS.map((group) => (
              <Chip
                key={group}
                label={muscleLabel(language, group)}
                active={selected.includes(group)}
                onClick={() =>
                  setSelected((c) => (c.includes(group) ? c.filter((g) => g !== group) : [...c, group].slice(0, 4)))
                }
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
                onClick={() =>
                  setSelected((c) => (c.includes(group) ? c.filter((g) => g !== group) : [...c, group].slice(0, 4)))
                }
              />
            ))}
          </div>

          {captureResult && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <span>
                  {t(language, "phase")}: <strong>{captureResult.phase_inferred}</strong>
                </span>
                <span>
                  {t(language, "fatigue")}: <strong>{captureResult.fatigue_level}</strong>
                </span>
                <span>
                  {t(language, "kLoad")}: <strong>{captureResult.k_load.toFixed(3)}</strong>
                </span>
                {captureResult.total_estimated_minutes != null && (
                  <span>
                    {t(language, "totalTime")}:{" "}
                    <strong>
                      {captureResult.total_estimated_minutes} {t(language, "minutes")}
                    </strong>
                  </span>
                )}
              </div>

              {captureResult.warmup.length > 0 && (
                <>
                  <h3 className="mt-4 font-semibold text-slate-700">{t(language, "warmup")}</h3>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {captureResult.warmup.map((e, i) => (
                      <RoutineCard key={i} entry={adapt(e)} language={language} />
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {captureResult.routine.map((e, i) => (
                  <RoutineCard key={i} entry={adapt(e)} language={language} />
                ))}
              </div>
            </div>
          )}
          {!captureResult && !loading && (
            <p className="mt-6 text-slate-500">{t(language, "noRoutine")}</p>
          )}
        </section>
      )}

      {tab === "supplements" && (
        <section className="mt-5">
          <button onClick={loadSupplements} className="rounded bg-teal-600 px-4 py-2 text-white">
            {t(language, "generate")}
          </button>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supplements?.items.map((item) => {
              const colors =
                item.safety === "SAFE"
                  ? "bg-green-100 text-green-700"
                  : item.safety === "CAUTION"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700";
              const label =
                item.safety === "SAFE"
                  ? t(language, "safe")
                  : item.safety === "CAUTION"
                    ? t(language, "caution")
                    : t(language, "avoid");
              return (
                <div key={item.supplement_id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{localized(item.name, language)}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs ${colors}`}>{label}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{localized(item.reason, language)}</p>
                  <p className="text-sm text-slate-700">
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

      {tab === "profile" && (
        <section className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-semibold text-slate-700">{t(language, "profile")}</h2>
            <div className="mt-3 space-y-3">
              <label className="block text-sm text-slate-600">
                {t(language, "height")}
                <input
                  type="number"
                  defaultValue={profile.height_cm ?? undefined}
                  onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })}
                  className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
                />
              </label>
              <label className="block text-sm text-slate-600">
                {t(language, "weightKg")}
                <input
                  type="number"
                  defaultValue={profile.weight_kg ?? undefined}
                  onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })}
                  className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
                />
              </label>
              <button
                onClick={async () => {
                  const saved = await updateMyProfile({ ...form, language });
                  setProfile(saved);
                }}
                className="rounded bg-teal-600 px-4 py-2 text-white"
              >
                {t(language, "save")}
              </button>
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
                    onChange={(e) => {
                      const weight = Number(e.target.value);
                      const loads = profile.loads.filter((l) => l.exercise_id !== exercise.id);
                      if (weight > 0) loads.push({ exercise_id: exercise.id, weight_kg: weight, reps: 10 });
                      setProfile({ ...profile, loads });
                    }}
                    className="w-24 rounded border border-slate-300 px-2 py-1"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={async () => {
                const saved = await updateMyProfile({ loads: profile.loads });
                setProfile(saved);
              }}
              className="mt-3 rounded bg-teal-600 px-4 py-2 text-white"
            >
              {t(language, "save")}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
