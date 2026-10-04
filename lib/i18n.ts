/** Minimal i18n. Spanish is the default; new screens keep their copy in lib/i18n-app.ts. */

import { APP_COPY } from "@/lib/i18n-app";

export type Language = "EN" | "ES" | "ZH";

export const LANGUAGES: Language[] = ["EN", "ES", "ZH"];

export const LANGUAGE_LABELS: Record<Language, string> = {
  EN: "English",
  ES: "Español",
  ZH: "中文",
};

type Dict = Record<string, string>;

const TRANSLATIONS: Record<Language, Dict> = {
  EN: {
    language: "Language",
    general: "General",
    objective: "Objective",
    reps: "Reps",
    warmup: "Warm-up / activation",
    error: "Error",
    // profile
    profile: "Profile",
    weightKg: "Weight (kg)",
    signUp: "Create account",
    email: "Email",
    password: "Password",
    logout: "Log out",
    machines: "My gym machines",
    calendar: "Cycle calendar",
    kcal: "kcal",
    share: "Share profile",


    alternatives: "Other ways to do it",
    series: "sets",
    kg: "kg",
  },
  ES: {
    language: "Idioma",
    general: "Generales",
    objective: "Objetivo",
    reps: "Repeticiones",
    warmup: "Calentamiento / activación",
    error: "Error",
    profile: "Perfil",
    weightKg: "Peso (kg)",
    signUp: "Crear cuenta",
    email: "Correo",
    password: "Contraseña",
    logout: "Cerrar sesión",
    machines: "Máquinas de mi gimnasio",
    calendar: "Calendario del ciclo",
    kcal: "kcal",
    share: "Compartir perfil",


    alternatives: "Otras formas de hacerlo",
    series: "series",
    kg: "kg",
  },
  ZH: {
    language: "语言",
    general: "整体部位",
    objective: "目标",
    reps: "次数",
    warmup: "热身 / 激活",
    error: "错误",
    profile: "个人资料",
    weightKg: "体重 (kg)",
    signUp: "创建账户",
    email: "邮箱",
    password: "密码",
    logout: "退出登录",
    machines: "我的健身房器械",
    calendar: "周期日历",
    kcal: "千卡",
    share: "共享资料",


    alternatives: "其他做法",
    series: "组",
    kg: "公斤",
  },
};

export function t(language: Language, key: string): string {
  return APP_COPY[language][key] ?? TRANSLATIONS[language][key] ?? APP_COPY.ES[key] ?? TRANSLATIONS.EN[key] ?? key;
}

/** `t()` plus {placeholder} substitution. */
export function tf(language: Language, key: string, vars: Record<string, string | number>): string {
  return t(language, key).replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

const MUSCLE_LABELS: Record<string, Record<Language, string>> = {
  GLUTES: { EN: "Glutes", ES: "Glúteos", ZH: "臀肌" },
  QUADRICEPS: { EN: "Quadriceps", ES: "Cuádriceps", ZH: "股四头肌" },
  HAMSTRINGS: { EN: "Hamstrings", ES: "Isquiotibiales", ZH: "腘绳肌" },
  CALVES: { EN: "Calves", ES: "Gemelos", ZH: "小腿" },
  ABS: { EN: "Abs", ES: "Abdomen", ZH: "腹肌" },
  OBLIQUES: { EN: "Obliques", ES: "Oblicuos", ZH: "腹斜肌" },
  BACK: { EN: "Back", ES: "Espalda", ZH: "背部" },
  LATS: { EN: "Lats", ES: "Dorsales", ZH: "背阔肌" },
  CHEST: { EN: "Chest", ES: "Pecho", ZH: "胸部" },
  SHOULDERS: { EN: "Shoulders", ES: "Hombros", ZH: "肩部" },
  BICEPS: { EN: "Biceps", ES: "Bíceps", ZH: "肱二头肌" },
  TRICEPS: { EN: "Triceps", ES: "Tríceps", ZH: "肱三头肌" },
  FOREARMS: { EN: "Forearms", ES: "Antebrazos", ZH: "前臂" },
  UPPER_BODY: { EN: "Upper body", ES: "Tren superior", ZH: "上肢" },
  LOWER_BODY: { EN: "Lower body", ES: "Tren inferior", ZH: "下肢" },
  FULL_BODY: { EN: "Full body", ES: "Cuerpo completo", ZH: "全身" },
  CORE: { EN: "Core", ES: "Core", ZH: "核心" },
  FULL_LEG: { EN: "Full leg", ES: "Pierna completa", ZH: "全腿" },
};

export function muscleLabel(language: Language, group: string): string {
  return MUSCLE_LABELS[group]?.[language] ?? group.replace(/_/g, " ");
}

const OBJECTIVES = [
  "STRENGTH",
  "HYPERTROPHY",
  "FAT_LOSS",
  "HEALTH",
  "RECOVERY",
  "PERFORMANCE",
  "GESTATIONAL_HEALTH",
] as const;

export type Objective = (typeof OBJECTIVES)[number];

export const OBJECTIVE_OPTIONS = OBJECTIVES;

const OBJECTIVE_LABELS: Record<string, Record<Language, string>> = {
  STRENGTH: { EN: "Strength", ES: "Fuerza", ZH: "力量" },
  HYPERTROPHY: { EN: "Hypertrophy", ES: "Hipertrofia", ZH: "增肌" },
  FAT_LOSS: { EN: "Fat loss", ES: "Pérdida de grasa", ZH: "减脂" },
  HEALTH: { EN: "Health", ES: "Salud", ZH: "健康" },
  RECOVERY: { EN: "Recovery", ES: "Recuperación", ZH: "恢复" },
  PERFORMANCE: { EN: "Performance", ES: "Rendimiento", ZH: "运动表现" },
  GESTATIONAL_HEALTH: { EN: "Gestational health", ES: "Salud gestacional", ZH: "孕期健康" },
};

export function objectiveLabel(language: Language, objective: string): string {
  return OBJECTIVE_LABELS[objective]?.[language] ?? objective.replace(/_/g, " ");
}

export function localized(text: Record<string, string> | undefined, language: Language): string {
  if (!text) return "";
  return text[language.toLowerCase()] ?? text.en ?? "";
}

const GOAL_LABELS: Record<string, Record<Language, string>> = {
  VOLUME: { EN: "Volume (bulk)", ES: "Volumen", ZH: "增肌期" },
  DEFINITION: { EN: "Definition (cut)", ES: "Definición", ZH: "减脂期" },
  MAINTENANCE: { EN: "Maintenance", ES: "Mantenimiento", ZH: "维持" },
  STRENGTH_FOCUS: { EN: "Strength focus", ES: "Enfoque fuerza", ZH: "力量优先" },
  RECOVERY: { EN: "Recovery", ES: "Recuperación", ZH: "恢复期" },
};

export const GOAL_OPTIONS = ["VOLUME", "DEFINITION", "MAINTENANCE", "STRENGTH_FOCUS", "RECOVERY"] as const;

export function goalLabel(language: Language, goal: string): string {
  return GOAL_LABELS[goal]?.[language] ?? goal.replace(/_/g, " ");
}
