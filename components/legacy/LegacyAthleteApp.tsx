"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarDay,
  CaptureResult,
  CatalogItem,
  EnergyLevel,
  ExerciseAlternative,
  ExerciseVariant,
  getExerciseAlternatives,
  GymMachine,
  IntakeRecord,
  JoinedGym,
  MyProfile,
  RoutineEntry,
  activateGym,
  getJoinedGyms,
  leaveGym,
  ShareLinkInfo,
  SharePermission,
  ShareRole,
  Stats,
  SymptomInfo,
  SupplementAdvice,
  SupplementCatalogItem,
  capture,
  createShare,
  deleteShare,
  getCalendar,
  getCatalog,
  getMachines,
  getMyProfile,
  getStats,
  getSupplementCatalog,
  getSupplementIntakes,
  joinGym,
  getSupplements,
  getSymptoms,
  listShares,
  setSupplementIntake,
  updateMyProfile,
} from "@/lib/api";
import { GENERAL_GROUPS, ISOLATED_GROUPS } from "@/lib/api";
import {
  GOAL_OPTIONS,
  LANGUAGES,
  LANGUAGE_LABELS,
  Language,
  OBJECTIVE_OPTIONS,
  goalLabel,
  localized,
  muscleLabel,
  objectiveLabel,
  t,
} from "@/lib/i18n";
import { Check, Dumbbell, Flame, Flower, Heart, Leaf, Pill, Search } from "@/components/icons";
import { ExerciseMedia } from "@/components/media/ExerciseMedia";
import { WorkoutRunner } from "@/components/workout/WorkoutRunner";
import { useSession } from "@/lib/session";
import { readEnergy } from "@/lib/energia";
import { todayISO } from "@/lib/dates";
import { ExerciseDetailModal } from "@/components/routine/ExerciseDetailModal";

export type LegacyTab = "routine" | "supplements" | "machines" | "profile";
type Tab = LegacyTab;

const today = () => new Date().toISOString().slice(0, 10);

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active ? "border-pink-500 bg-pink-500 text-white" : "border-pink-200 bg-white text-pink-700 hover:border-pink-400"
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
    type === "WARMUP" ? t(language, "warmup") : type === "APPROXIMATION" ? t(language, "approximation") : type === "EFFECTIVE" ? t(language, "effective") : type;
  return (
    <ul className="text-xs text-slate-600">
      {Object.entries(groups).map(([type, list]) => (
        <li key={type}>
          <strong>{labelFor(type)}:</strong> {list.length}×{list[0].reps} @ {list[0].weight_kg}kg · {list[0].rest_seconds}s
        </li>
      ))}
    </ul>
  );
}

function RoutineCard({ entry, language, onOpen }: { entry: RoutineEntry; language: Language; onOpen?: () => void }) {
  return (
    <div
      onClick={onOpen}
      className={`overflow-hidden rounded-xl border border-pink-100 bg-white shadow-sm ${onOpen ? "cursor-pointer transition hover:border-pink-300" : ""}`}
    >
      <ExerciseMedia mediaUrl={entry.media_url} imageUrl={entry.image_url} alt={entry.exercise_original} />
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800">{entry.exercise_original}</h3>
          {entry.impact && <span className="rounded bg-pink-50 px-2 py-0.5 text-xs text-pink-700">{entry.impact}</span>}
        </div>
        {entry.machine_name && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">
            <Dumbbell size={12} /> {localized(entry.machine_name, language)}
          </span>
        )}
        {entry.blocked && (
          <div className="rounded border-l-4 border-pink-400 bg-pink-50 p-2 text-sm text-pink-800">
            <strong>{t(language, "blocked")}:</strong> {entry.block_reason}
            {entry.exercise_substitute && (
              <div>
                {t(language, "substitute")}: <em>{entry.exercise_substitute}</em>
              </div>
            )}
          </div>
        )}
        {entry.description && <p className="text-sm text-slate-600">{localized(entry.description, language)}</p>}
        {entry.how_to && (
          <p className="rounded bg-pink-50 p-2 text-xs text-pink-800">
            <strong>{t(language, "howTo")}:</strong> {localized(entry.how_to, language)}
          </p>
        )}
        {entry.tips && entry.tips.length > 0 && (
          <ul className="list-inside list-disc text-xs text-slate-500">
            {entry.tips.map((tip, i) => (
              <li key={i}>{localized(tip, language)}</li>
            ))}
          </ul>
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
    how_to: (entry.how_to as Record<string, string>) ?? undefined,
    tips: (entry.tips as Record<string, string>[]) ?? undefined,
    image_url: entry.image_url as string | undefined,
    sets: entry.sets as RoutineEntry["sets"],
    machine_id: entry.machine_id as string | undefined,
    machine_name: (entry.machine_name as RoutineEntry["machine_name"]) ?? undefined,
    movement_pattern: entry.movement_pattern as string | undefined,
    compound: entry.compound as boolean | undefined,
    rationale: entry.rationale as string | undefined,
  };
}

const KIND_STYLE: Record<string, string> = {
  CYCLE: "bg-rose-500 text-white",
  OVULATION: "bg-rose-300 text-rose-900",
  STRENGTH: "bg-pink-400 text-white",
  LOW_IMPACT: "bg-pink-200 text-pink-900",
  REST: "bg-slate-100 text-slate-500",
};

function KindIcon({ kind }: { kind: string }) {
  if (kind === "CYCLE") return <Flower size={14} />;
  if (kind === "OVULATION") return <Heart size={14} />;
  if (kind === "LOW_IMPACT") return <Leaf size={14} />;
  if (kind === "STRENGTH") return <Dumbbell size={14} />;
  return null;
}

/**
 * Athlete app from before the redesign, kept working while each screen is
 * rebuilt (see FEATURES.md). Session, language and onboarding now come from
 * SessionProvider and the route guards.
 */
export function LegacyAthleteApp({ initialTab = "routine" }: { initialTab?: LegacyTab }) {
  const router = useRouter();
  const session = useSession();
  const { user, language, setLanguage } = session;
  const [profile, setProfileState] = useState<MyProfile | null>(session.profile);
  const setProfile = (next: MyProfile | null) => {
    setProfileState(next);
    session.setProfile(next);
  };
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, setSelected] = useState<string[]>([]);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [supplements, setSupplements] = useState<SupplementAdvice | null>(null);
  const [supplementCatalog, setSupplementCatalog] = useState<SupplementCatalogItem[]>([]);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [machines, setMachines] = useState<GymMachine[]>([]);
  const [machineSearch, setMachineSearch] = useState("");
  const [joinedGyms, setJoinedGyms] = useState<JoinedGym[]>([]);
  const [gymFilter, setGymFilter] = useState<string>("ALL");
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [changeIndex, setChangeIndex] = useState<number | null>(null);
  const [changeOptions, setChangeOptions] = useState<ExerciseAlternative[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState<Stats | null>(null);
  const [shares, setShares] = useState<ShareLinkInfo[]>([]);
  const [shareRole, setShareRole] = useState<ShareRole>("TRAINER");
  const [sharePermissions, setSharePermissions] = useState<SharePermission[]>([
    "PROFILE",
    "ROUTINE",
    "PROGRESS",
  ]);
  const [shareLabel, setShareLabel] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [machineFormOpen, setMachineFormOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [symptoms, setSymptoms] = useState<{ id: string; name: string; modality: string; advice: string }[]>([]);
  const [workout, setWorkout] = useState(false);
  const [exercisesCount, setExercisesCount] = useState(5);
  const [timeBudget, setTimeBudget] = useState<number | "">("");
  // Pre-filled with what the athlete logged on Today (lib/energia.ts).
  const [energy, setEnergy] = useState<EnergyLevel>(() => readEnergy(todayISO()) ?? "MODERATE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only the fields the athlete edits on the profile tab; never resend onboarding defaults.
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    getCatalog(language).then(setCatalog).catch(() => setCatalog([]));
    getMachines(language).then(setMachines).catch(() => setMachines([]));
    getSupplementCatalog(language).then(setSupplementCatalog).catch(() => setSupplementCatalog([]));
    getSymptoms(language).then(setSymptoms).catch(() => setSymptoms([]));
    getJoinedGyms(language).then(setJoinedGyms).catch(() => setJoinedGyms([]));
  }, [language]);

  // Live gym machines: refresh on focus, when entering the tab, and by polling.
  useEffect(() => {
    if (!user || tab !== "machines") return;
    const refresh = () => { getJoinedGyms(language).then(setJoinedGyms).catch(() => null); };
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(id);
    };
  }, [user, tab, language]);

  useEffect(() => {
    if (user && profile) {
      getCalendar(calendarMonth, language).then((c) => setCalendar(c.days)).catch(() => setCalendar([]));
      getStats().then(setStats).catch(() => setStats(null));
      getSupplementIntakes(today()).then(setIntakes).catch(() => setIntakes([]));
      listShares().then(setShares).catch(() => setShares([]));
    }
  }, [user, profile, calendarMonth, language]);

  const onLogout = () => {
    session.signOut();
    router.replace("/entrar");
  };

  const saveProfile = async (data: Record<string, unknown>) => {
    setError(null);
    try {
      setProfile(await updateMyProfile({ ...data, language }));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateEntry = (index: number, field: string, value: number) => {
    setCaptureResult((prev) => {
      if (!prev) return prev;
      const routine = prev.routine.map((e, i) => (i === index ? { ...e, [field]: value } : e));
      return { ...prev, routine };
    });
  };

  const replaceEntry = (index: number, item: CatalogItem) => {
    setCaptureResult((prev) => {
      if (!prev) return prev;
      const routine = prev.routine.map((e, i) =>
        i === index
          ? {
              ...e,
              exercise_id: item.id,
              name: item.name,
              image_url: item.image_url,
              description: { en: item.description },
              machine_id: undefined,
              machine_name: undefined,
            }
          : e,
      );
      return { ...prev, routine };
    });
  };

  const removeEntry = (index: number) => {
    setCaptureResult((prev) => {
      if (!prev) return prev;
      return { ...prev, routine: prev.routine.filter((_, i) => i !== index) };
    });
  };

  const applyVariant = (index: number, variant: ExerciseVariant) => {
    setCaptureResult((prev) => {
      if (!prev) return prev;
      const routine = prev.routine.map((e, i) =>
        i === index
          ? { ...e, exercise_id: variant.id, name: variant.name, image_url: variant.image_url, machine_id: undefined, machine_name: undefined }
          : e,
      );
      return { ...prev, routine };
    });
    setDetailIndex(null);
  };

  const openChange = async (index: number) => {
    const entry = captureResult?.routine[index];
    const exerciseId = entry?.exercise_id as string | undefined;
    setChangeIndex(index);
    setChangeOptions([]);
    if (exerciseId) {
      getExerciseAlternatives(exerciseId, language).then(setChangeOptions).catch(() => setChangeOptions([]));
    }
  };

  const applyAlternative = (index: number, alt: ExerciseAlternative) => {
    setCaptureResult((prev) => {
      if (!prev) return prev;
      const routine = prev.routine.map((e, i) =>
        i === index
          ? { ...e, exercise_id: alt.id, name: alt.name, image_url: alt.image_url, machine_id: undefined, machine_name: undefined }
          : e,
      );
      return { ...prev, routine };
    });
    setChangeIndex(null);
  };

  const onTakeData = async () => {
    setError(null);
    setLoading(true);
    try {
      setCaptureResult(
        await capture(selected.length ? selected.join(",") : undefined, {
          exercisesCount,
          timeBudgetMinutes: timeBudget === "" ? undefined : Number(timeBudget),
          energy,
          language,
        }),
      );
      getStats().then(setStats).catch(() => null);
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
          {
            goalPhase: profile?.goal_phase,
            weightKg: profile?.weight_kg,
            heightCm: profile?.height_cm,
            bodyFatPct: profile?.body_fat_pct,
            age: profile?.age,
            dailyCalories: profile?.daily_calories,
          },
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, [profile, language]);

  useEffect(() => {
    if (tab === "supplements" && user && profile) void loadSupplements();
  }, [tab, user, profile, loadSupplements]);

  const toggleIntake = async (supplementId: string) => {
    const current = intakes.find((i) => i.supplement_id === supplementId);
    const next = !current?.taken;
    await setSupplementIntake(supplementId, today(), next).catch(() => null);
    setIntakes((list) => [
      ...list.filter((i) => i.supplement_id !== supplementId),
      { supplement_id: supplementId, date: today(), taken: next },
    ]);
  };

  const shareUrl = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/shared/${token}` : `/shared/${token}`;

  const onCreateShare = async () => {
    setError(null);
    try {
      const link = await createShare(shareRole, sharePermissions, shareLabel || undefined);
      setShares((list) => [link, ...list]);
      setShareLabel("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onDeleteShare = async (token: string) => {
    await deleteShare(token).catch(() => null);
    setShares((list) => list.filter((s) => s.token !== token));
  };

  const onCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      setCopied(token);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const onPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => saveProfile({ photo_url: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const toggleCurrentSupplement = (id: string) => {
    const current = new Set(profile?.current_supplements ?? []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    saveProfile({ current_supplements: [...current] });
  };

  const saveSupplementMacro = (id: string, key: string, value: number) => {
    const list = [...(profile?.supplement_macros ?? [])];
    const existing = list.find((m) => m.supplement_id === id) ?? {
      supplement_id: id,
      macros: { protein_g: 0, carbs_g: 0, fat_g: 0, kcal: 0 },
    };
    const macros = { ...existing.macros, [key]: value };
    const next = [...list.filter((m) => m.supplement_id !== id), { supplement_id: id, macros }];
    saveProfile({ supplement_macros: next });
  };

  const loadsById = useMemo(() => {
    const map: Record<string, number> = {};
    profile?.loads.forEach((l) => (map[l.exercise_id] = l.weight_kg));
    return map;
  }, [profile]);

  const trainingDates = useMemo(() => new Set(stats?.training_dates ?? []), [stats]);
  const dailyCatalog = useMemo(() => supplementCatalog.filter((s) => s.is_daily), [supplementCatalog]);
  const filteredMachines = useMemo(() => {
    const q = machineSearch.trim().toLowerCase();
    return q ? machines.filter((m) => m.name.toLowerCase().includes(q)) : machines;
  }, [machines, machineSearch]);

  // Hash map index of joined gyms for O(1) lookup while filtering by gym.
  const joinedGymIndex = useMemo(() => new Map(joinedGyms.map((g) => [g.gym_id, g])), [joinedGyms]);
  const visibleJoinedGyms = useMemo(() => {
    if (gymFilter === "ALL") return joinedGyms;
    const only = joinedGymIndex.get(gymFilter);
    return only ? [only] : joinedGyms;
  }, [joinedGyms, gymFilter, joinedGymIndex]);

  const detailRaw = captureResult && detailIndex != null ? captureResult.routine[detailIndex] : null;
  const detailEntry = detailRaw ? adapt(detailRaw) : null;
  const detailBaselineKg = detailEntry?.exercise_id
    ? (profile?.loads ?? []).find((l) => l.exercise_id === detailEntry.exercise_id)?.weight_kg
    : undefined;
  const detailMachineFactor = detailEntry?.machine_id
    ? joinedGyms.flatMap((g) => g.machines).find((m) => m.id === detailEntry.machine_id)?.weight_factor
    : undefined;


  if (!user || !profile) return null;

  const timeline = profile.timeline;

  if (workout && captureResult) {
    return (
      <WorkoutRunner
        entries={captureResult.routine.map(adapt)}
        language={language}
        onExit={() => setWorkout(false)}
      />
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt="profile" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <Flower size={22} className="text-pink-500" />
          )}
          <div>
            <h1 className="text-xl font-bold text-pink-700">
              {t(language, "welcome")}, {user.display_name}
            </h1>
            <p className="text-sm text-slate-600">
              {timeline
                ? timeline.modality === "GESTATIONAL"
                  ? `${timeline.week} weeks`
                  : `${t(language, "cycleToday")} ${timeline.cycle_day} · ${timeline.phase} · ${goalLabel(language, profile.goal_phase ?? "MAINTENANCE")}`
                : t(language, "noProfileYet")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700">
            <Flame size={16} /> {stats?.streak_days ?? 0}
          </span>
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="rounded border border-pink-200 px-2 py-1 text-sm">
            {LANGUAGES.map((lang) => (<option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>))}
          </select>
          <button onClick={() => setTab("profile")} className="rounded-full bg-pink-500 px-3 py-1 text-sm text-white hover:bg-pink-600">
            {t(language, "profile")}
          </button>
          <button onClick={onLogout} className="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-800">
            {t(language, "logout")}
          </button>
        </div>
      </header>

      <nav className="mt-5 flex gap-2 border-b border-pink-100">
        {(["routine", "supplements", "machines", "profile"] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === item ? "border-pink-500 text-pink-600" : "border-transparent text-slate-500"}`}
          >
            {item === "routine" ? t(language, "tabRoutine") : item === "supplements" ? t(language, "tabSupplements") : item === "machines" ? t(language, "myMachines") : t(language, "profile")}
          </button>
        ))}
      </nav>

      {error && <p className="mt-4 text-sm text-rose-600">{t(language, "error")}: {error}</p>}

      {tab === "routine" && (
        <section className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={onTakeData} disabled={loading} className="flex items-center gap-2 rounded-full bg-pink-500 px-6 py-2 text-white disabled:opacity-50">
              <Dumbbell size={18} /> {loading ? t(language, "capturing") : t(language, "takeData")}
            </button>
            <span className="text-sm text-slate-500">{t(language, "selectHint")}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-4 rounded-2xl border border-pink-100 bg-white p-3 text-sm text-slate-600">
            <label>
              {t(language, "exercisesCount")}
              <input type="number" min={1} max={12} value={exercisesCount} onChange={(e) => setExercisesCount(Number(e.target.value))} className="ml-2 w-16 rounded border border-pink-200 px-2 py-1" />
            </label>
            <label>
              {t(language, "timeBudget")}
              <input type="number" min={10} max={180} placeholder={t(language, "noLimit")} value={timeBudget} onChange={(e) => setTimeBudget(e.target.value === "" ? "" : Number(e.target.value))} className="ml-2 w-24 rounded border border-pink-200 px-2 py-1" />
            </label>
            <label>
              {t(language, "energy")}
              <select value={energy} onChange={(e) => setEnergy(e.target.value as EnergyLevel)} className="ml-2 rounded border border-pink-200 px-2 py-1">
                <option value="ENERGY">{t(language, "energyEnergy")}</option>
                <option value="MODERATE">{t(language, "energyModerate")}</option>
                <option value="NO_ENERGY">{t(language, "energyNo")}</option>
              </select>
            </label>
          </div>

          <div className="mt-3 rounded-2xl border border-pink-100 bg-white p-4">
            <h3 className="font-semibold text-pink-700">{t(language, "symptomsTitle")}</h3>
            <p className="text-xs text-slate-500">{t(language, "symptomsHint")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {symptoms.filter((s) => (profile.modality === "GESTATIONAL" ? true : s.modality !== "GESTATIONAL")).map((s) => {
                const active = (profile.symptoms ?? []).includes(s.id);
                return (
                  <button key={s.id} onClick={() => {
                    const cur = new Set(profile.symptoms ?? []);
                    if (active) cur.delete(s.id); else cur.add(s.id);
                    saveProfile({ symptoms: [...cur] });
                  }} className={`rounded-full border px-3 py-1 text-sm ${active ? "border-pink-500 bg-pink-500 text-white" : "border-pink-200 bg-white text-pink-700"}`}>{s.name}</button>
                );
              })}
            </div>
            <div className="mt-3">
              <span className="text-sm font-medium text-slate-700">{t(language, "overallPain")}</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const level = (profile.pain_levels ?? {})["OVERALL"] ?? 0;
                  return (
                    <button
                      key={n}
                      title={`${n}/10`}
                      onClick={() => saveProfile({ pain_levels: { ...(profile.pain_levels ?? {}), OVERALL: level === n ? 0 : n } })}
                      className={`transition ${n <= level ? "scale-110 text-pink-500" : "text-pink-300 hover:text-pink-400"}`}
                    >
                      <Flower size={22} />
                    </button>
                  );
                })}
                <span className="ml-1 text-xs text-slate-500">{(profile.pain_levels ?? {})["OVERALL"] ?? 0}/10</span>
              </div>
            </div>
            {(profile.symptoms ?? []).map((sid) => {
              const level = (profile.pain_levels ?? {})[sid] ?? 0;
              const symptom = symptoms.find((x) => x.id === sid);
              return (
                <div key={sid} className="mt-3">
                  <span className="text-sm text-slate-600">{symptom?.name ?? sid}</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        title={`${n}/10`}
                        onClick={() => saveProfile({ pain_levels: { ...(profile.pain_levels ?? {}), [sid]: level === n ? 0 : n } })}
                        className={`transition ${n <= level ? "scale-110 text-pink-500" : "text-pink-300 hover:text-pink-400"}`}
                      >
                        <Flower size={20} />
                      </button>
                    ))}
                    <span className="ml-1 text-xs text-slate-500">{level}/10</span>
                  </div>
                </div>
              );
            })}
            <textarea
              value={profile.symptom_notes ?? ""}
              onChange={(e) => setForm({ ...form, symptom_notes: e.target.value })}
              onBlur={(e) => saveProfile({ symptom_notes: e.target.value })}
              placeholder={t(language, "symptomsPlaceholder")}
              className="mt-2 w-full rounded border border-pink-200 px-2 py-1 text-sm"
              rows={2}
            />
          </div>

          <p className="mt-3 text-xs uppercase tracking-wide text-pink-400">{t(language, "isolated")}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {ISOLATED_GROUPS.map((group) => (
              <Chip key={group} label={muscleLabel(language, group)} active={selected.includes(group)} onClick={() => setSelected((c) => (c.includes(group) ? c.filter((g) => g !== group) : [...c, group].slice(0, 4)))} />
            ))}
          </div>
          <p className="mt-3 text-xs uppercase tracking-wide text-pink-400">{t(language, "general")}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {GENERAL_GROUPS.map((group) => (
              <Chip key={group} label={muscleLabel(language, group)} active={selected.includes(group)} onClick={() => setSelected((c) => (c.includes(group) ? c.filter((g) => g !== group) : [...c, group].slice(0, 4)))} />
            ))}
          </div>

          {captureResult && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <span>{t(language, "phase")}: <strong>{captureResult.phase_inferred}</strong></span>
                <span>{t(language, "fatigue")}: <strong>{captureResult.fatigue_level}</strong></span>
                <span>{t(language, "kLoad")}: <strong>{captureResult.k_load.toFixed(3)}</strong></span>
                {captureResult.total_estimated_minutes != null && (<span>{t(language, "totalTime")}: <strong>{captureResult.total_estimated_minutes} {t(language, "minutes")}</strong></span>)}
                {captureResult.engine_used && (
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">
                    {t(language, "reasonedBy")}: <strong>{captureResult.engine_used === "deepseek" ? "DeepSeek" : "SyncFit"}</strong>
                  </span>
                )}
              </div>
              <button onClick={() => setWorkout(true)} className="mt-3 flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2 text-white hover:bg-pink-700">
                <Dumbbell size={18} /> {t(language, "startRoutine")}
              </button>

              {captureResult.alerts && captureResult.alerts.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
                  {captureResult.alerts.map((a, i) => (<li key={i}>{a}</li>))}
                </ul>
              )}

              {captureResult.warmup.length > 0 && (
                <>
                  <h3 className="mt-4 font-semibold text-pink-700">{t(language, "warmup")}</h3>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {captureResult.warmup.map((e, i) => (<RoutineCard key={i} entry={adapt(e)} language={language} />))}
                  </div>
                </>
              )}
              <div className="mt-4 rounded-2xl border border-pink-100 bg-white p-4">
                <h3 className="font-semibold text-pink-700">{t(language, "editRoutine")}</h3>
                <p className="text-xs text-slate-500">{t(language, "editRoutineHint")}</p>
                <div className="mt-2 space-y-2">
                  {captureResult.routine.map((e, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                      <select
                        value={String(e.exercise_id ?? "")}
                        onChange={(ev) => { const item = catalog.find((c) => c.id === ev.target.value); if (item) replaceEntry(i, item); }}
                        className="min-w-[10rem] flex-1 rounded border border-pink-200 px-2 py-1"
                      >
                        {!e.exercise_id && <option value="">{String(e.name ?? "")}</option>}
                        {catalog.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <label className="text-slate-500">{t(language, "series")}
                        <input type="number" min={0} value={Number(e.series ?? 3)} onChange={(ev) => updateEntry(i, "series", Number(ev.target.value))} className="ml-1 w-16 rounded border border-pink-200 px-1 py-0.5" />
                      </label>
                      <label className="text-slate-500">{t(language, "repsLabel")}
                        <input type="number" min={0} value={Number(e.reps ?? 10)} onChange={(ev) => updateEntry(i, "reps", Number(ev.target.value))} className="ml-1 w-16 rounded border border-pink-200 px-1 py-0.5" />
                      </label>
                      <label className="text-slate-500">{t(language, "kg")}
                        <input type="number" min={0} value={Number(e.weight_suggested_kg ?? 0)} onChange={(ev) => updateEntry(i, "weight_suggested_kg", Number(ev.target.value))} className="ml-1 w-20 rounded border border-pink-200 px-1 py-0.5" />
                      </label>
                      <button onClick={() => openChange(i)} className="rounded-full bg-pink-100 px-3 py-0.5 text-xs text-pink-700">{t(language, "changeExercise")}</button>
                      <button onClick={() => removeEntry(i)} className="rounded-full bg-white px-3 py-0.5 text-xs text-slate-500">{t(language, "removeExercise")}</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {captureResult.routine.map((e, i) => (
                  <RoutineCard key={i} entry={adapt(e)} language={language} onOpen={() => setDetailIndex(i)} />
                ))}
              </div>

              {changeIndex != null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setChangeIndex(null)}>
                  <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-pink-100 bg-white p-5 shadow-xl" onClick={(ev) => ev.stopPropagation()}>
                    <h3 className="text-lg font-bold text-pink-700">{t(language, "changeExercise")}</h3>
                    <p className="text-xs text-slate-500">{t(language, "otherWays")}</p>
                    <ul className="mt-3 space-y-1">
                      {changeOptions.map((alt) => (
                        <li key={alt.id}>
                          <button
                            onClick={() => applyAlternative(changeIndex, alt)}
                            className="flex w-full items-center justify-between rounded-lg border border-pink-100 bg-white px-3 py-2 text-left text-sm hover:border-pink-400"
                          >
                            <span className="text-slate-700">{alt.name}</span>
                            <span className="text-xs text-slate-400">
                              {(alt.required_equipment ?? []).join("+") || "-"}
                              {alt.available ? ` · ${t(language, "available")}` : ""}
                            </span>
                          </button>
                        </li>
                      ))}
                      {changeOptions.length === 0 && <li className="text-xs text-slate-500">…</li>}
                    </ul>
                    <button onClick={() => setChangeIndex(null)} className="mt-3 rounded-full bg-white px-4 py-1 text-sm text-slate-600">{t(language, "close")}</button>
                  </div>
                </div>
              )}

              {detailEntry && detailIndex != null && (
                <ExerciseDetailModal
                  entry={detailEntry}
                  language={language}
                  baselineKg={detailBaselineKg}
                  kLoad={captureResult.k_load}
                  machineFactor={detailMachineFactor}
                  biomarkers={captureResult.biomarkers}
                  onClose={() => setDetailIndex(null)}
                  onSelectVariant={(v) => applyVariant(detailIndex, v)}
                  onRemove={() => { removeEntry(detailIndex); setDetailIndex(null); }}
                />
              )}
            </div>
          )}
          {!captureResult && !loading && <p className="mt-6 text-slate-500">{t(language, "noRoutine")}</p>}
        </section>
      )}

      {tab === "supplements" && (
        <section className="mt-5 space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm text-slate-600">{t(language, "objective")}
              <select value={profile.objective ?? "HYPERTROPHY"} onChange={(e) => saveProfile({ objective: e.target.value })} className="ml-2 rounded border border-pink-200 px-2 py-1">
                {OBJECTIVE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{objectiveLabel(language, opt)}</option>))}
              </select>
            </label>
            <label className="text-sm text-slate-600">{t(language, "goalPhase")}
              <select value={profile.goal_phase ?? "MAINTENANCE"} onChange={(e) => saveProfile({ goal_phase: e.target.value })} className="ml-2 rounded border border-pink-200 px-2 py-1">
                {GOAL_OPTIONS.map((goal) => (<option key={goal} value={goal}>{goalLabel(language, goal)}</option>))}
              </select>
            </label>
            <button onClick={loadSupplements} className="rounded-full bg-pink-500 px-5 py-2 text-white">{t(language, "generate")}</button>
          </div>

          {supplements?.daily_macros && (
            <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-pink-700"><Leaf size={18} /> {t(language, "dailyMacros")}</h3>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-700">
                <span>{t(language, "kcal")}: <strong>{supplements.daily_macros.kcal}</strong></span>
                <span>{t(language, "protein")}: <strong>{supplements.daily_macros.protein_g} g</strong></span>
                <span>{t(language, "carbs")}: <strong>{supplements.daily_macros.carbs_g} g</strong></span>
                <span>{t(language, "fat")}: <strong>{supplements.daily_macros.fat_g} g</strong></span>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-pink-700"><Pill size={18} /> {t(language, "currentSupplements")}</h3>
            <div className="mt-2 space-y-2">
              {(profile.current_supplements ?? []).map((id) => {
                const item = supplementCatalog.find((s) => s.id === id);
                if (!item) return null;
                const macro = (profile.supplement_macros ?? []).find((m) => m.supplement_id === id)?.macros;
                const taken = intakes.some((i) => i.supplement_id === id && i.taken);
                return (
                  <div key={id} className="rounded-lg border border-pink-200 p-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-slate-800">{item.name}</strong>
                      <div className="flex gap-1">
                        {item.is_daily && (
                          <button onClick={() => toggleIntake(id)} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${taken ? "bg-green-100 text-green-700" : "bg-pink-500 text-white"}`}>
                            <Check size={12} /> {taken ? t(language, "taken") : t(language, "markTaken")}
                          </button>
                        )}
                        <button onClick={() => toggleCurrentSupplement(id)} className="rounded-full bg-pink-100 px-3 py-1 text-xs text-pink-700">{t(language, "remove")}</button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-slate-500">
                      {(["kcal", "protein_g", "carbs_g", "fat_g"] as const).map((key) => (
                        <label key={key}>
                          {key}
                          <input
                            type="number"
                            defaultValue={macro ? macro[key] : ""}
                            onBlur={(e) => saveSupplementMacro(id, key, Number(e.target.value))}
                            className="mt-1 w-full rounded border border-pink-200 px-1 py-0.5"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(profile.current_supplements ?? []).length === 0 && <p className="text-sm text-slate-500">{t(language, "noResults")}</p>}
            </div>
            <p className="mt-4 text-xs uppercase tracking-wide text-pink-400">{t(language, "add")}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {supplementCatalog.filter((s) => !(profile.current_supplements ?? []).includes(s.id)).map((item) => (
                <button key={item.id} onClick={() => toggleCurrentSupplement(item.id)} className="rounded-full bg-pink-50 px-3 py-1 text-xs text-pink-700 hover:bg-pink-100">
                  + {item.name}
                </button>
              ))}
            </div>
          </div>

          <h3 className="flex items-center gap-2 font-semibold text-pink-700"><Leaf size={18} /> {t(language, "suggestedSupplements")}</h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supplements?.items.map((item) => {
              const colors = item.safety === "SAFE" ? "bg-green-100 text-green-700" : item.safety === "CAUTION" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
              const label = item.safety === "SAFE" ? t(language, "safe") : item.safety === "CAUTION" ? t(language, "caution") : t(language, "avoid");
              const meta = supplementCatalog.find((s) => s.id === item.supplement_id);
              return (
                <div key={item.supplement_id} className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{localized(item.name, language)}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs ${colors}`}>{label}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{localized(item.reason, language)}</p>
                  <p className="text-sm text-slate-700">{t(language, "dosage")}: {localized(item.dosage, language)}</p>
                  {meta?.brand_examples.length ? <p className="text-xs text-pink-600">{t(language, "brands")}: {meta.brand_examples.join(", ")}</p> : null}
                  <p className="text-xs text-slate-500">{t(language, "macros")}: {item.macros.protein_g}P / {item.macros.carbs_g}C / {item.macros.fat_g}F · {item.macros.kcal} kcal</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "machines" && (
        <section className="mt-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-pink-100 bg-white p-3">
            <span className="text-sm text-slate-600">{t(language, "joinGymLabel")}</span>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder={t(language, "joinCodePlaceholder")} className="rounded border border-pink-200 px-2 py-1 text-sm" />
            <button onClick={async () => { try { await joinGym(joinCode); setJoinCode(""); getMachines(language).then(setMachines); setJoinedGyms(await getJoinedGyms(language)); setProfile(await getMyProfile()); } catch (e) { setError((e as Error).message); } }} className="rounded-full bg-pink-500 px-4 py-1 text-sm text-white">{t(language, "joinButton")}</button>
            <button onClick={() => { getJoinedGyms(language).then(setJoinedGyms).catch(() => null); }} className="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700">{t(language, "refresh")}</button>
          </div>

          {joinedGyms.length > 0 && (
            <div className="mb-4 rounded-2xl border border-pink-100 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-pink-700">{t(language, "joinedGyms")}</h3>
                <div className="flex items-center gap-2">
                  {joinedGyms.length > 1 && (
                    <select value={gymFilter} onChange={(e) => setGymFilter(e.target.value)} className="rounded border border-pink-200 px-2 py-1 text-sm">
                      <option value="ALL">{t(language, "allGyms")}</option>
                      {joinedGyms.map((g) => (<option key={g.gym_id} value={g.gym_id}>{g.name}</option>))}
                    </select>
                  )}
                  <button onClick={() => { getJoinedGyms(language).then(setJoinedGyms).catch(() => null); }} className="rounded-full bg-pink-100 px-3 py-0.5 text-xs text-pink-700">{t(language, "refresh")}</button>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">{t(language, "gymMachinesHint")}</p>
              <div className="mt-3 space-y-4">
                {visibleJoinedGyms.map((g) => (
                  <div key={g.gym_id} className="rounded-xl border border-pink-50 bg-pink-50/30 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <strong className="text-slate-700">{g.name}</strong>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">#{g.code}</span>
                      {g.active ? (
                        <span className="rounded-full bg-pink-500 px-2 py-0.5 text-xs text-white">{t(language, "activeGym")}</span>
                      ) : (
                        <button onClick={async () => { try { await activateGym(g.gym_id, language); setJoinedGyms(await getJoinedGyms(language)); setProfile(await getMyProfile()); } catch (e) { setError((e as Error).message); } }} className="rounded-full bg-white px-2 py-0.5 text-xs text-pink-700">{t(language, "setActive")}</button>
                      )}
                      <button onClick={async () => { try { await leaveGym(g.gym_id); setJoinedGyms(await getJoinedGyms(language)); setProfile(await getMyProfile()); } catch (e) { setError((e as Error).message); } }} className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{t(language, "leaveGym")}</button>
                    </div>
                    {g.machines.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">{t(language, "adminNoMachines")}</p>
                    ) : (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {g.machines.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 rounded-xl border border-pink-200 bg-white p-2">
                            {m.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.image_url} alt={m.name_text ?? ""} className="h-12 w-12 rounded object-cover" />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded bg-pink-50 text-pink-300"><Dumbbell size={18} /></span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-slate-700">{localized(m.name, language)}</p>
                              <p className="text-xs text-slate-500"><span className="rounded bg-pink-100 px-1.5 py-0.5 text-pink-700">{g.name}</span> ×{m.weight_factor}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-pink-700">{t(language, "myMachinesSelected")}</h2>
            <button onClick={() => setMachineFormOpen((v) => !v)} className="flex items-center gap-1 rounded-full bg-pink-500 px-4 py-2 text-sm text-white">
              <Dumbbell size={16} /> {machineFormOpen ? t(language, "close") : t(language, "addMachine")}
            </button>
          </div>

          {!machineFormOpen && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(profile.available_machines ?? []).map((id) => {
                const machine = machines.find((m) => m.id === id);
                if (!machine) return null;
                return (
                  <div key={id} className="flex items-center justify-between rounded-xl border border-pink-200 bg-white p-3">
                    <span className="text-sm text-slate-700">{machine.name} <span className="text-pink-500">×{machine.weight_factor}</span></span>
                    <button
                      onClick={() => {
                        const next = (profile.available_machines ?? []).filter((m) => m !== id);
                        saveProfile({ available_machines: next });
                      }}
                      className="rounded-full bg-pink-100 px-3 py-1 text-xs text-pink-700"
                    >
                      {t(language, "remove")}
                    </button>
                  </div>
                );
              })}
              {(profile.available_machines ?? []).length === 0 && (
                <div className="rounded-xl border border-dashed border-pink-200 bg-white p-4 text-sm text-slate-500">
                  <p className="font-medium text-pink-700">{t(language, "noMachines")}</p>
                  <p>{t(language, "noMachinesHint")}</p>
                </div>
              )}
            </div>
          )}

          {machineFormOpen && (
            <>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2">
                <Search size={18} className="text-pink-500" />
                <input value={machineSearch} onChange={(e) => setMachineSearch(e.target.value)} placeholder={t(language, "searchMachines")} className="w-full outline-none" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMachines.map((machine) => {
                  const checked = (profile.available_machines ?? []).includes(machine.id);
                  return (
                    <div key={machine.id} className={`overflow-hidden rounded-2xl border ${checked ? "border-pink-400" : "border-pink-100"} bg-white shadow-sm`}>
                      {machine.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={machine.image_url} alt={machine.name} className="h-36 w-full object-cover" />
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-slate-800">{machine.name}</h3>
                          <span className="rounded bg-pink-50 px-2 py-0.5 text-xs text-pink-700">×{machine.weight_factor}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{machine.notes}</p>
                        <button
                          onClick={() => {
                            const current = new Set(profile.available_machines ?? []);
                            if (checked) current.delete(machine.id);
                            else current.add(machine.id);
                            saveProfile({ available_machines: [...current] });
                          }}
                          className={`mt-3 flex items-center gap-1 rounded-full px-3 py-1 text-sm ${checked ? "bg-pink-500 text-white" : "bg-pink-100 text-pink-700"}`}
                        >
                          <Check size={14} /> {checked ? t(language, "remove") : t(language, "add")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "profile" && (
        <section className="mt-5 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-pink-700">{t(language, "profile")}</h2>
              <div className="mt-3 flex items-center gap-3">
                {profile.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photo_url} alt="profile" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-400"><Flower size={24} /></span>
                )}
                <label className="cursor-pointer rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700">
                  {t(language, "changePhoto")}
                  <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block text-sm text-slate-600">{t(language, "height")}<input type="number" defaultValue={profile.height_cm ?? undefined} onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })} className="mt-1 w-full rounded border border-pink-200 px-2 py-1" /></label>
                <label className="block text-sm text-slate-600">{t(language, "weightKg")}<input type="number" defaultValue={profile.weight_kg ?? undefined} onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })} className="mt-1 w-full rounded border border-pink-200 px-2 py-1" /></label>
                <label className="block text-sm text-slate-600">{t(language, "bodyFat")}<input type="number" defaultValue={profile.body_fat_pct ?? undefined} onChange={(e) => setForm({ ...form, body_fat_pct: Number(e.target.value) })} className="mt-1 w-full rounded border border-pink-200 px-2 py-1" /></label>
                <label className="block text-sm text-slate-600">{t(language, "dailyCalories")}<input type="number" defaultValue={profile.daily_calories ?? undefined} onChange={(e) => setForm({ ...form, daily_calories: Number(e.target.value) })} className="mt-1 w-full rounded border border-pink-200 px-2 py-1" /></label>
                <label className="block text-sm text-slate-600">Weekly goal<input type="number" defaultValue={profile.weekly_training_goal ?? 4} onChange={(e) => setForm({ ...form, weekly_training_goal: Number(e.target.value) })} className="mt-1 w-full rounded border border-pink-200 px-2 py-1" /></label>
                <label className="block text-sm text-slate-600">Rest allowance<input type="number" defaultValue={profile.rest_days_allowance ?? 3} onChange={(e) => setForm({ ...form, rest_days_allowance: Number(e.target.value) })} className="mt-1 w-full rounded border border-pink-200 px-2 py-1" /></label>
              </div>
              <button onClick={() => saveProfile(form)} className="mt-3 rounded-full bg-pink-500 px-4 py-2 text-white">{t(language, "save")}</button>
            </div>

            <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Flower size={18} /> {t(language, "calendar")}</h2>
                <input type="month" value={calendarMonth} onChange={(e) => setCalendarMonth(e.target.value)} className="rounded border border-pink-200 px-2 py-1 text-sm" />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-700">
                <span className="flex items-center gap-1"><Flame size={16} className="text-pink-500" /> {t(language, "streak")}: <strong>{stats?.streak_days ?? 0}</strong></span>
                <span>{t(language, "trainingDays")}: <strong>{stats?.week_training_days ?? 0}/{stats?.weekly_goal ?? 4}</strong></span>
                <span>{t(language, "restDaysLeft")}: <strong>{stats?.rest_days_left ?? 0}</strong></span>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
                {calendar.map((day) => (
                  <div key={day.date} title={day.note ? localized(day.note, language) : ""} className={`rounded-lg p-2 ${KIND_STYLE[day.kind] ?? KIND_STYLE.REST} ${trainingDates.has(day.date) ? "ring-2 ring-pink-500" : ""}`}>
                    <div className="font-semibold">{day.date.slice(-2)}</div>
                    <div className="flex justify-center"><KindIcon kind={day.kind} /></div>
                    {day.cycle_day && <div className="text-[10px]">d{day.cycle_day}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Flower size={14} /> {t(language, "period")}</span>
                <span className="flex items-center gap-1"><Heart size={14} /> {t(language, "ovulation")}</span>
                <span className="flex items-center gap-1"><Leaf size={14} /> {t(language, "lowImpact")}</span>
                <span className="flex items-center gap-1"><Dumbbell size={14} /> {t(language, "strengthDay")}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Heart size={18} /> {t(language, "share")}</h2>
            <p className="text-sm text-slate-500">{t(language, "shareWith")}</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-sm text-slate-600">{t(language, "shareWith")}
                <select value={shareRole} onChange={(e) => setShareRole(e.target.value as ShareRole)} className="ml-2 rounded border border-pink-200 px-2 py-1">
                  {(["TRAINER", "COACH", "PARTNER", "FRIEND", "FAMILY", "OTHER"] as ShareRole[]).map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </label>
              <input value={shareLabel} onChange={(e) => setShareLabel(e.target.value)} placeholder="label" className="rounded border border-pink-200 px-2 py-1 text-sm" />
              <button onClick={onCreateShare} className="rounded-full bg-pink-500 px-4 py-2 text-sm text-white">{t(language, "createLink")}</button>
            </div>
            <p className="mt-3 text-sm text-slate-600">{t(language, "permissions")}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {(["PROFILE", "ROUTINE", "CALENDAR", "PROGRESS", "SUPPLEMENTS", "MACHINES", "LOADS"] as SharePermission[]).map((perm) => (
                <label key={perm} className="flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs text-pink-700">
                  <input
                    type="checkbox"
                    className="accent-pink-500"
                    checked={sharePermissions.includes(perm)}
                    onChange={() => setSharePermissions((list) => list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm])}
                  />
                  {perm}
                </label>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {shares.length === 0 && <p className="text-sm text-slate-500">{t(language, "noLinks")}</p>}
              {shares.map((s) => (
                <div key={s.token} className="flex items-center justify-between gap-2 rounded-lg border border-pink-100 p-2 text-sm">
                  <span className="truncate"><strong>{s.role}</strong> · {s.permissions.join(", ")}</span>
                  <span className="flex shrink-0 gap-1">
                    <button onClick={() => onCopy(s.token)} className="rounded-full bg-pink-100 px-3 py-1 text-xs text-pink-700">
                      {copied === s.token ? t(language, "copied") : t(language, "copyLink")}
                    </button>
                    <button onClick={() => onDeleteShare(s.token)} className="rounded-full bg-pink-100 px-3 py-1 text-xs text-pink-700">{t(language, "remove")}</button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-pink-700">Symptoms</h2>
            <p className="text-sm text-slate-500">Select what you feel; the routine adapts (cramps, low back, knee, contractions, dilation).</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {symptoms
                .filter((s) => (profile.modality === "GESTATIONAL" ? true : s.modality !== "GESTATIONAL"))
                .map((s) => {
                  const active = (profile.symptoms ?? []).includes(s.id);
                  return (
                    <button key={s.id} onClick={() => {
                      const current = new Set(profile.symptoms ?? []);
                      if (active) current.delete(s.id); else current.add(s.id);
                      saveProfile({ symptoms: [...current] });
                    }} className={`rounded-full border px-3 py-1 text-sm ${active ? "border-pink-500 bg-pink-500 text-white" : "border-pink-200 bg-white text-pink-700"}`}>
                      {s.name}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-pink-700">{t(language, "myLoads")}</h2>
              <label className="text-sm text-slate-600">{t(language, "unit")}
                <select value={profile.weight_unit ?? "KG"} onChange={(e) => saveProfile({ weight_unit: e.target.value })} className="ml-2 rounded border border-pink-200 px-2 py-1">
                  <option value="KG">kg</option>
                  <option value="LB">lb</option>
                </select>
              </label>
            </div>
            <p className="text-sm text-slate-500">{t(language, "loadNote")} ({profile.weight_unit ?? "KG"})</p>
            <div className="mt-3 grid gap-1 sm:grid-cols-2">
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
                    className="w-24 rounded border border-pink-200 px-2 py-1"
                  />
                </div>
              ))}
            </div>
            <button onClick={() => saveProfile({ loads: profile.loads })} className="mt-3 rounded-full bg-pink-500 px-4 py-2 text-white">{t(language, "save")}</button>
          </div>
        </section>
      )}
    </main>
  );
}
