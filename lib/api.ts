/** API client for the SyncFit Edge backend. */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/api/v1/ws/telemetry";

export type Language = "EN" | "ES" | "ZH";

export const ISOLATED_GROUPS = [
  "GLUTES",
  "QUADRICEPS",
  "HAMSTRINGS",
  "CALVES",
  "ABS",
  "OBLIQUES",
  "BACK",
  "LATS",
  "CHEST",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
] as const;

export const GENERAL_GROUPS = [
  "UPPER_BODY",
  "LOWER_BODY",
  "FULL_BODY",
  "CORE",
  "FULL_LEG",
] as const;

export type MuscleGroup = (typeof ISOLATED_GROUPS)[number] | (typeof GENERAL_GROUPS)[number];

export type LocalizedText = Record<string, string>;

export interface Decision {
  phase_inferred: string;
  fatigue_level: string;
  k_load_multiplier: number;
  rmssd_hrv_ms: number;
}

export interface TelemetryFrame {
  schema_version: string;
  device_id: string;
  session_id: string;
  timestamp: string;
  modality: "MENSTRUAL_CYCLE" | "GESTATIONAL";
  day_or_week: number;
  biomarkers: {
    delta_temperature_c: number;
    rmssd_hrv_ms: number;
    isometric_force_loss_pct: number;
  };
  ppg_window: { sample_rate_hz: number; window_size: number; samples: number[] };
}

export type EnergyLevel = "ENERGY" | "MODERATE" | "NO_ENERGY";

export interface SetPrescription {
  type: "WARMUP" | "ACTIVATION" | "APPROXIMATION" | "EFFECTIVE";
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  estimated_seconds: number;
  tempo?: string | null;
}

export interface RoutineEntry {
  exercise_original: string;
  blocked: boolean;
  block_reason: string;
  exercise_substitute: string;
  series_adapted: number;
  reps_adapted: number;
  weight_suggested_kg: number;
  exercise_id?: string;
  muscle_groups?: string[];
  impact?: string;
  role?: string;
  description?: LocalizedText;
  how_to?: LocalizedText;
  tips?: LocalizedText[];
  image_url?: string;
  media_url?: string | null;
  rest_seconds?: number;
  estimated_seconds?: number;
  sets?: SetPrescription[];
}

export interface RoutineResponse {
  schema_version: string;
  language: Language;
  muscle_groups: string[];
  phase_inferred?: string | null;
  fatigue_level?: string | null;
  k_load_multiplier?: number | null;
  alerts: string[];
  total_estimated_minutes?: number;
  warmup?: RoutineEntry[];
  routine: RoutineEntry[];
  variation_pct?: number;
}

export interface SupplementAdviceItem {
  supplement_id: string;
  name: LocalizedText;
  category: string;
  safety: "SAFE" | "CAUTION" | "AVOID";
  dosage: LocalizedText;
  macros: { protein_g: number; carbs_g: number; fat_g: number; kcal: number };
  reason: LocalizedText;
  image_url?: string;
}

export interface SupplementAdvice {
  language: Language;
  modality?: string;
  objective?: string;
  goal_phase?: string;
  daily_macros?: { protein_g: number; carbs_g: number; fat_g: number; kcal: number };
  items: SupplementAdviceItem[];
}

export interface ExerciseLoad {
  exercise_id: string;
  weight_kg: number;
  reps?: number;
}

export interface Profile {
  profile_id: string;
  display_name: string;
  language: Language;
  is_guest: boolean;
  height_cm?: number;
  weight_kg?: number;
  objective?: string;
  modality?: "MENSTRUAL_CYCLE" | "GESTATIONAL";
  loads: ExerciseLoad[];
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  muscle_groups: string[];
  equipment: string;
  impact: string;
  image_url: string;
  media_url: string | null;
}

export interface RoutineOptions {
  engine?: "simulator" | "ai";
  withTelemetry?: boolean;
  profileId?: string;
  exercisesCount?: number;
  timeBudgetMinutes?: number;
  energy?: EnergyLevel;
  objective?: string;
  includeWarmup?: boolean;
}

export const SAMPLE_FRAME: TelemetryFrame = {
  schema_version: "1.0.0",
  device_id: "frontend-demo",
  session_id: "3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  timestamp: "2026-09-21T13:24:05Z",
  modality: "MENSTRUAL_CYCLE",
  day_or_week: 14,
  biomarkers: {
    delta_temperature_c: 0.42,
    rmssd_hrv_ms: 28.5,
    isometric_force_loss_pct: 12.8,
  },
  ppg_window: {
    sample_rate_hz: 100,
    window_size: 8,
    samples: [0.1, 0.2, -0.1, 0.3, 0.0, -0.2, 0.15, 0.05],
  },
};

export async function getHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_URL}/api/v1/health`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`health check failed: ${response.status}`);
  }
  return response.json();
}

export async function sendTelemetry(frame: TelemetryFrame): Promise<Decision> {
  const response = await fetch(`${API_URL}/api/v1/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(frame),
  });
  if (!response.ok) {
    throw new Error(`telemetry failed: ${response.status}`);
  }
  const data = (await response.json()) as { decision: Decision };
  return data.decision;
}

export async function getMuscleGroups(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/v1/muscle-groups`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`muscle groups failed: ${response.status}`);
  }
  return response.json();
}

export async function generateRoutine(
  muscleGroups: string[],
  language: Language,
  options: RoutineOptions = {},
): Promise<RoutineResponse> {
  const engine = options.engine ?? "simulator";
  const body: Record<string, unknown> = {
    schema_version: "1.2.0",
    muscle_groups: muscleGroups,
    language,
    exercises_count: options.exercisesCount ?? 5,
    include_warmup: options.includeWarmup ?? true,
  };
  if (options.withTelemetry) body.telemetry = SAMPLE_FRAME;
  if (options.timeBudgetMinutes) body.time_budget_minutes = options.timeBudgetMinutes;
  if (options.energy) body.energy_level = options.energy;
  if (options.objective) body.objective = options.objective;
  const query = new URLSearchParams({ engine });
  if (options.profileId) query.set("profile_id", options.profileId);
  const response = await fetch(`${API_URL}/api/v1/routines?${query.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`routine failed: ${response.status}`);
  }
  return response.json();
}

export async function getCatalog(language: Language): Promise<CatalogItem[]> {
  const response = await fetch(`${API_URL}/api/v1/catalog?language=${language}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`catalog failed: ${response.status}`);
  }
  return response.json();
}

export async function getSupplements(
  modality: "MENSTRUAL_CYCLE" | "GESTATIONAL",
  language: Language,
  objective?: string,
  extras: {
    goalPhase?: string;
    weightKg?: number;
    heightCm?: number;
    bodyFatPct?: number;
    age?: number;
    dailyCalories?: number;
  } = {},
): Promise<SupplementAdvice> {
  const query = new URLSearchParams({ modality, language });
  if (objective) query.set("objective", objective);
  if (extras.goalPhase) query.set("goal_phase", extras.goalPhase);
  if (extras.weightKg) query.set("weight_kg", String(extras.weightKg));
  if (extras.heightCm) query.set("height_cm", String(extras.heightCm));
  if (extras.bodyFatPct) query.set("body_fat_pct", String(extras.bodyFatPct));
  if (extras.age) query.set("age", String(extras.age));
  if (extras.dailyCalories) query.set("daily_calories", String(extras.dailyCalories));
  const response = await fetch(`${API_URL}/api/v1/supplements?${query.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`supplements failed: ${response.status}`);
  }
  return response.json();
}

export interface GymMachine {
  id: string;
  name: string;
  type: string;
  unit?: string | null;
  weight_factor: number;
  exercises: string[];
  notes: string;
  image_url?: string | null;
}

export async function getMachines(language: Language): Promise<GymMachine[]> {
  const response = await fetch(`${API_URL}/api/v1/machines?language=${language}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`machines failed: ${response.status}`);
  return response.json();
}

export interface CalendarDay {
  date: string;
  kind: "CYCLE" | "OVULATION" | "STRENGTH" | "LOW_IMPACT" | "REST";
  cycle_day?: number;
  phase?: string;
  label?: Record<string, string>;
  note?: Record<string, string>;
}

export async function getCalendar(month: string, language: Language): Promise<{ month: string; days: CalendarDay[] }> {
  const response = await fetch(
    `${API_URL}/api/v1/calendar?month=${month}&language=${language}`,
    { headers: authHeaders() },
  );
  if (!response.ok) throw new Error(`calendar failed: ${response.status}`);
  return response.json();
}

export interface SupplementCatalogItem {
  id: string;
  name: string;
  category: string;
  dosage: string;
  frequency?: string | null;
  is_daily: boolean;
  brand_examples: string[];
  macros: { protein_g: number; carbs_g: number; fat_g: number; kcal: number };
  safety_general: string;
  safety_pregnancy: string;
  notes: string;
}

export async function getSupplementCatalog(language: Language): Promise<SupplementCatalogItem[]> {
  const response = await fetch(`${API_URL}/api/v1/supplements/catalog?language=${language}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`supplement catalog failed: ${response.status}`);
  return response.json();
}

export interface SymptomInfo {
  id: string;
  name: string;
  modality: string;
  advice: string;
  impact_cap?: string;
  block_training?: boolean;
}

export async function getSymptoms(language: Language): Promise<SymptomInfo[]> {
  const response = await fetch(`${API_URL}/api/v1/symptoms?language=${language}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`symptoms failed: ${response.status}`);
  return response.json();
}

export interface IntakeRecord {
  supplement_id: string;
  date: string;
  taken: boolean;
}

export async function getSupplementIntakes(date: string): Promise<IntakeRecord[]> {
  const response = await fetch(`${API_URL}/api/v1/supplement-intakes?date=${date}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`intakes failed: ${response.status}`);
  return response.json();
}

export async function setSupplementIntake(
  supplementId: string,
  date: string,
  taken: boolean,
): Promise<IntakeRecord> {
  const response = await fetch(`${API_URL}/api/v1/supplement-intakes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ supplement_id: supplementId, date, taken }),
  });
  if (!response.ok) throw new Error(`intake failed: ${response.status}`);
  return response.json();
}

export interface Stats {
  streak_days: number;
  today_trained: boolean;
  week_training_days: number;
  weekly_goal: number;
  rest_days_allowance: number;
  rest_days_left: number;
  training_dates: string[];
}

export async function getStats(): Promise<Stats> {
  const response = await fetch(`${API_URL}/api/v1/stats`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`stats failed: ${response.status}`);
  return response.json();
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const body = {
    schema_version: "1.2.0",
    ...profile,
    loads: profile.loads.map((load) => ({ ...load, reps: load.reps ?? 10 })),
  };
  const response = await fetch(`${API_URL}/api/v1/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`profile failed: ${response.status}`);
  }
  return response.json();
}

/* --- Authentication ------------------------------------------------------- */

const TOKEN_KEY = "syncfit-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function logoutLocal(): void {
  setToken(null);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  role: "ATHLETE" | "GYM_ADMIN" | "SUPER_ADMIN";
}

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  if (!response.ok) throw new Error(`register failed: ${response.status}`);
  const data = await response.json();
  setToken(data.access_token);
  return data.user as AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`login failed: ${response.status}`);
  const data = await response.json();
  setToken(data.access_token);
  return data.user as AuthUser;
}

export async function getMe(): Promise<AuthUser | null> {
  if (!getToken()) return null;
  const response = await fetch(`${API_URL}/api/v1/auth/me`, { headers: authHeaders() });
  if (!response.ok) {
    if (response.status === 401) setToken(null);
    return null;
  }
  return response.json();
}

export interface Timeline {
  modality: string;
  cycle_day?: number;
  cycle_length_days?: number;
  week?: number;
  phase?: string;
}

export interface MyProfile {
  profile_id: string;
  language: string;
  height_cm?: number;
  weight_kg?: number;
  body_fat_pct?: number;
  daily_calories?: number;
  age?: number;
  objective?: string;
  goal_phase?: string;
  modality?: string;
  available_machines?: string[];
  current_supplements?: string[];
  symptoms?: string[];
  pain_levels?: Record<string, number>;
  symptom_notes?: string;
  supplement_macros?: { supplement_id: string; macros: { protein_g: number; carbs_g: number; fat_g: number; kcal: number } }[];
  weight_unit?: string;
  photo_url?: string;
  weekly_training_goal?: number;
  rest_days_allowance?: number;
  last_period_date?: string;
  cycle_length_days?: number;
  gestation_week?: number;
  loads: ExerciseLoad[];
  timeline?: Timeline | null;
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const response = await fetch(`${API_URL}/api/v1/profiles/me`, { headers: authHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`profile failed: ${response.status}`);
  return response.json();
}

export async function updateMyProfile(data: Record<string, unknown>): Promise<MyProfile> {
  const response = await fetch(`${API_URL}/api/v1/profiles/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`onboarding failed: ${response.status}`);
  return response.json();
}

export async function getCycle(): Promise<{ timeline: Timeline | null }> {
  const response = await fetch(`${API_URL}/api/v1/cycle`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`cycle failed: ${response.status}`);
  return response.json();
}

export interface CaptureResult {
  session_id: string;
  routine_id: string;
  scenario: string;
  phase_inferred: string;
  fatigue_level: string;
  k_load: number;
  total_estimated_minutes?: number;
  alerts?: string[];
  warmup: Record<string, unknown>[];
  routine: Record<string, unknown>[];
  timeline?: Timeline | null;
}

export async function capture(
  path?: string,
  options: {
    exercisesCount?: number;
    timeBudgetMinutes?: number;
    energy?: EnergyLevel;
    includeWarmup?: boolean;
  } = {},
): Promise<CaptureResult> {
  const query = new URLSearchParams();
  if (path) query.set("muscle_groups", path);
  if (options.exercisesCount) query.set("exercises_count", String(options.exercisesCount));
  if (options.timeBudgetMinutes) query.set("time_budget_minutes", String(options.timeBudgetMinutes));
  if (options.energy) query.set("energy_level", options.energy);
  if (options.includeWarmup === false) query.set("include_warmup", "false");
  const response = await fetch(`${API_URL}/api/v1/capture?${query.toString()}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`capture failed: ${response.status}`);
  return response.json();
}



export type ShareRole = "TRAINER" | "COACH" | "PARTNER" | "FRIEND" | "FAMILY" | "OTHER";

export type SharePermission =
  | "PROFILE"
  | "ROUTINE"
  | "CALENDAR"
  | "PROGRESS"
  | "SUPPLEMENTS"
  | "MACHINES"
  | "LOADS";

export interface ShareLinkInfo {
  token: string;
  role: ShareRole;
  label?: string | null;
  permissions: SharePermission[];
  active: boolean;
}

export async function createShare(
  role: ShareRole,
  permissions: SharePermission[],
  label?: string,
): Promise<ShareLinkInfo> {
  const response = await fetch(`${API_URL}/api/v1/shares`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role, permissions, label }),
  });
  if (!response.ok) throw new Error(`share failed: ${response.status}`);
  return response.json();
}

export async function listShares(): Promise<ShareLinkInfo[]> {
  const response = await fetch(`${API_URL}/api/v1/shares`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`shares failed: ${response.status}`);
  return response.json();
}

export async function deleteShare(token: string): Promise<void> {
  await fetch(`${API_URL}/api/v1/shares/${token}`, { method: "DELETE", headers: authHeaders() });
}

export interface SharedProfile {
  owner_display_name: string;
  owner_photo_url?: string | null;
  role: ShareRole;
  permissions: SharePermission[];
  updated_at?: string;
  profile?: Record<string, unknown> | null;
  timeline?: Record<string, unknown> | null;
  routine?: Record<string, unknown> | null;
  calendar?: Record<string, unknown> | null;
  machines?: string[] | null;
  loads?: Record<string, unknown>[] | null;
  supplements?: Record<string, unknown>[] | null;
}

export async function getShared(token: string): Promise<SharedProfile> {
  const response = await fetch(`${API_URL}/api/v1/shared/${token}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`shared profile failed: ${response.status}`);
  return response.json();
}


/* --- Admin ---------------------------------------------------------------- */

export async function createGymAdmin(email: string, password: string, displayName: string): Promise<AuthUser> {
  const r = await fetch(`${API_URL}/api/v1/admin/gym-admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  if (!r.ok) throw new Error(`create gym admin failed: ${r.status}`);
  return r.json();
}

export async function listGymAdmins(): Promise<AuthUser[]> {
  const r = await fetch(`${API_URL}/api/v1/admin/gym-admins`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`gym admins failed: ${r.status}`);
  return r.json();
}

export interface GymInfo {
  id: string;
  name: string;
  code: string;
  owner_user_id: string;
  machines: { id: string; name: string; purpose?: string | null; image_url?: string | null; weight_factor: number }[];
}

export async function createGym(name: string): Promise<GymInfo> {
  const r = await fetch(`${API_URL}/api/v1/gyms`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ name }) });
  if (!r.ok) throw new Error(`create gym failed: ${r.status}`);
  return r.json();
}

export async function listMyGyms(): Promise<GymInfo[]> {
  const r = await fetch(`${API_URL}/api/v1/gyms/mine`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`my gyms failed: ${r.status}`);
  return r.json();
}

export async function addGymMachine(gymId: string, name: string, purpose?: string, imageUrl?: string): Promise<unknown> {
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/machines`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, purpose, image_url: imageUrl }),
  });
  if (!r.ok) throw new Error(`add machine failed: ${r.status}`);
  return r.json();
}

export async function joinGym(code: string): Promise<unknown> {
  const r = await fetch(`${API_URL}/api/v1/gyms/join`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ code }) });
  if (!r.ok) throw new Error(`join gym failed: ${r.status}`);
  return r.json();
}

export async function fetchGymQr(gymId: string): Promise<string> {
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/qr.png`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`qr failed: ${r.status}`);
  return URL.createObjectURL(await r.blob());
}
