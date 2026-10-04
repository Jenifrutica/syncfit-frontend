/** API client for the SyncFit Edge backend. */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/api/v1/ws/telemetry";

export type Language = "EN" | "ES" | "ZH";

/** Error with the HTTP status and the backend's `detail`, so the UI can explain it. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiError(prefix: string, response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  return new ApiError(`${prefix} failed: ${response.status}`, response.status, body?.detail);
}

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
  machine_id?: string;
  machine_name?: LocalizedText;
  movement_pattern?: string;
  compound?: boolean;
  rationale?: string;
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
  document_id?: string | null;
  role: "ATHLETE" | "GYM_ADMIN" | "SUPER_ADMIN";
  active?: boolean;
}

export async function register(
  email: string,
  password: string,
  displayName: string,
  documentId: string,
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, display_name: displayName, document_id: documentId.trim() }),
  });
  if (!response.ok) throw await apiError("register", response);
  const data = await response.json();
  setToken(data.access_token);
  return data.user as AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!response.ok) throw await apiError("login", response);
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
  document_id?: string | null;
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
  active_gym_id?: string | null;
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
  if (!response.ok) throw await apiError("onboarding", response);
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
  biomarkers?: { delta_temperature_c: number; rmssd_hrv_ms: number; isometric_force_loss_pct: number };
  assessment?: { phase_inferred: string; fatigue_level: string; autonomic_status?: string; articular_risk_pct?: number };
  machine_preferences?: Record<string, { exercise_id: string; pattern?: string | null; name?: string | null; weight_factor?: number | null }>;
  engine_used?: string;
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
    language?: Language;
  } = {},
): Promise<CaptureResult> {
  const query = new URLSearchParams();
  if (options.language) query.set("language", options.language);
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
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, display_name: displayName }),
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
  machines: GymMachineInfo[];
}

export async function createGym(name: string): Promise<GymInfo> {
  const r = await fetch(`${API_URL}/api/v1/gyms`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ name }) });
  if (!r.ok) throw new Error(`create gym failed: ${r.status}`);
  return r.json();
}

export async function listMyGyms(language?: Language): Promise<GymInfo[]> {
  const query = language ? `?language=${language}` : "";
  const r = await fetch(`${API_URL}/api/v1/gyms/mine${query}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`my gyms failed: ${r.status}`);
  return r.json();
}

export async function updateGym(gymId: string, name: string, language?: Language): Promise<GymInfo> {
  const query = language ? `?language=${language}` : "";
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}${query}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!r.ok) throw new Error(`update gym failed: ${r.status}`);
  return r.json();
}

export async function deleteGym(gymId: string): Promise<void> {
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}`, { method: "DELETE", headers: authHeaders() });
  if (!r.ok) throw new Error(`delete gym failed: ${r.status}`);
}

export interface ExerciseVariant {
  id: string;
  name: string;
  equipment_type?: string | null;
  equipment: string;
  impact: string;
  image_url?: string | null;
  media_url?: string | null;
  variant_of?: string | null;
}

export async function getExerciseVariants(exerciseId: string, language: Language): Promise<ExerciseVariant[]> {
  const r = await fetch(`${API_URL}/api/v1/exercises/${exerciseId}/variants?language=${language}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`variants failed: ${r.status}`);
  return r.json();
}

export interface GymMachineInfo {
  id: string;
  gym_id: string;
  name: LocalizedText;
  name_text?: string;
  purpose?: LocalizedText | null;
  purpose_text?: string | null;
  exercise_ids?: string[];
  equipment_key?: string | null;
  equipment_type?: string | null;
  image_url?: string | null;
  weight_factor: number;
}

export async function addGymMachine(
  gymId: string,
  name: string,
  purpose?: string,
  imageUrl?: string,
  language?: Language,
  exerciseIds?: string[],
  equipmentKey?: string,
  equipmentType?: string,
): Promise<GymMachineInfo> {
  const query = language ? `?language=${language}` : "";
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/machines${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, purpose, image_url: imageUrl, exercise_ids: exerciseIds, equipment_key: equipmentKey, equipment_type: equipmentType }),
  });
  if (!r.ok) throw new Error(`add machine failed: ${r.status}`);
  return r.json();
}

export async function updateGymMachine(
  gymId: string,
  machineId: string,
  patch: { name?: string; purpose?: string | null; image_url?: string | null; weight_factor?: number; exercise_ids?: string[]; equipment_key?: string | null; equipment_type?: string | null },
  language?: Language,
): Promise<GymMachineInfo> {
  const query = language ? `?language=${language}` : "";
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/machines/${machineId}${query}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(`update machine failed: ${r.status}`);
  return r.json();
}

export async function deleteGymMachine(gymId: string, machineId: string): Promise<void> {
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/machines/${machineId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error(`delete machine failed: ${r.status}`);
}

/**
 * Read an image file and return a compressed JPEG data URL (client-side).
 * The image is scaled down to `maxSize` px on its longest side and encoded
 * at 0.8 quality so it can be stored directly in the DB without bloating
 * API responses.
 */
export async function fileToDataUrl(file: File, maxSize = 1024): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("invalid image"));
    image.src = dataUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export async function joinGym(code: string): Promise<JoinedGym> {
  const r = await fetch(`${API_URL}/api/v1/gyms/join`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ code }) });
  if (!r.ok) throw new Error(`join gym failed: ${r.status}`);
  return r.json();
}

export interface JoinedGym {
  gym_id: string;
  name: string;
  code: string;
  active: boolean;
  joined_at?: string | null;
  machines: GymMachineInfo[];
}

export async function getJoinedGyms(language?: Language): Promise<JoinedGym[]> {
  const query = language ? `?language=${language}` : "";
  const r = await fetch(`${API_URL}/api/v1/gyms/joined${query}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`joined gyms failed: ${r.status}`);
  return r.json();
}

export async function leaveGym(gymId: string): Promise<void> {
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/leave`, { method: "DELETE", headers: authHeaders() });
  if (!r.ok) throw new Error(`leave gym failed: ${r.status}`);
}

export async function activateGym(gymId: string, language?: Language): Promise<JoinedGym> {
  const query = language ? `?language=${language}` : "";
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/activate${query}`, { method: "POST", headers: authHeaders() });
  if (!r.ok) throw new Error(`activate gym failed: ${r.status}`);
  return r.json();
}

export async function fetchGymQr(gymId: string): Promise<string> {
  const r = await fetch(`${API_URL}/api/v1/gyms/${gymId}/qr.png`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`qr failed: ${r.status}`);
  return URL.createObjectURL(await r.blob());
}


export interface ExerciseAlternative {
  id: string;
  name: string;
  movement_pattern?: string | null;
  equipment_type?: string | null;
  required_equipment?: string[];
  available?: boolean;
  variant_of?: string | null;
  image_url?: string | null;
}

export async function getExerciseAlternatives(exerciseId: string, language: Language): Promise<ExerciseAlternative[]> {
  const r = await fetch(`${API_URL}/api/v1/exercises/${exerciseId}/alternatives?language=${language}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`alternatives failed: ${r.status}`);
  return r.json();
}

/* --- Super admin: users ---------------------------------------------------- */

export interface AdminUser extends AuthUser {
  created_at?: string | null;
}

export async function listUsers(search?: string, role?: string): Promise<AdminUser[]> {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (role) query.set("role", role);
  const r = await fetch(`${API_URL}/api/v1/admin/users?${query.toString()}`, { headers: authHeaders(), cache: "no-store" });
  if (!r.ok) throw new Error(`users failed: ${r.status}`);
  return r.json();
}

export async function getUserDetail(id: string): Promise<{ user: AdminUser; profile: Record<string, unknown> | null }> {
  const r = await fetch(`${API_URL}/api/v1/admin/users/${id}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`user detail failed: ${r.status}`);
  return r.json();
}

export async function updateUser(id: string, patch: Record<string, unknown>): Promise<AdminUser> {
  const r = await fetch(`${API_URL}/api/v1/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(`update user failed: ${r.status}`);
  return r.json();
}

export async function setUserActive(id: string, active: boolean): Promise<AdminUser> {
  const r = await fetch(`${API_URL}/api/v1/admin/users/${id}/${active ? "activate" : "deactivate"}`, { method: "POST", headers: authHeaders() });
  if (!r.ok) throw new Error(`active failed: ${r.status}`);
  return r.json();
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  const r = await fetch(`${API_URL}/api/v1/admin/users/${id}/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) throw new Error(`reset password failed: ${r.status}`);
}

export async function setUserRole(id: string, role: string, adminPassword: string): Promise<AdminUser> {
  const r = await fetch(`${API_URL}/api/v1/admin/users/${id}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role, admin_password: adminPassword }),
  });
  if (!r.ok) throw new Error(`role failed: ${r.status}`);
  return r.json();
}

export async function deleteUser(id: string, adminPassword: string): Promise<void> {
  const r = await fetch(`${API_URL}/api/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ admin_password: adminPassword }),
  });
  if (!r.ok) throw new Error(`delete user failed: ${r.status}`);
}
