/** Minimal i18n. English is the default; more languages can be added. */

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
    title: "SyncFit Edge",
    subtitle: "Adaptive training prescription for the cycle and pregnancy.",
    language: "Language",
    muscleGroups: "Muscle groups",
    isolated: "Isolated",
    general: "General",
    generate: "Generate routine",
    generating: "Generating…",
    clear: "Clear",
    selectHint: "Select up to 4 groups (combine isolated + general).",
    blocked: "Blocked",
    substitute: "Substitute",
    sets: "Sets",
    reps: "Reps",
    weight: "Weight (kg)",
    impact: "Impact",
    kLoad: "k_load",
    phase: "Phase",
    fatigue: "Fatigue",
    health: "Check backend health",
    error: "Error",
    noRoutine: "Pick muscle groups and generate a routine.",
  },
  ES: {
    title: "SyncFit Edge",
    subtitle: "Prescripción adaptativa de entrenamiento para el ciclo y el embarazo.",
    language: "Idioma",
    muscleGroups: "Grupos musculares",
    isolated: "Aislados",
    general: "Generales",
    generate: "Generar rutina",
    generating: "Generando…",
    clear: "Limpiar",
    selectHint: "Selecciona hasta 4 grupos (combina aislados + generales).",
    blocked: "Bloqueado",
    substitute: "Sustituto",
    sets: "Series",
    reps: "Repeticiones",
    weight: "Peso (kg)",
    impact: "Impacto",
    kLoad: "k_load",
    phase: "Fase",
    fatigue: "Fatiga",
    health: "Verificar estado del backend",
    error: "Error",
    noRoutine: "Elige grupos musculares y genera una rutina.",
  },
  ZH: {
    title: "SyncFit Edge",
    subtitle: "针对月经周期与孕期的自适应训练处方。",
    language: "语言",
    muscleGroups: "肌肉群",
    isolated: "孤立肌群",
    general: "整体部位",
    generate: "生成训练计划",
    generating: "生成中…",
    clear: "清除",
    selectHint: "最多选择 4 个肌群（可组合孤立与整体）。",
    blocked: "已屏蔽",
    substitute: "替代动作",
    sets: "组数",
    reps: "次数",
    weight: "重量 (kg)",
    impact: "冲击",
    kLoad: "k_load",
    phase: "阶段",
    fatigue: "疲劳",
    health: "检查后端状态",
    error: "错误",
    noRoutine: "选择肌群并生成训练计划。",
  },
};

export function t(language: Language, key: string): string {
  return TRANSLATIONS[language][key] ?? TRANSLATIONS.EN[key] ?? key;
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

export function localized(text: Record<string, string> | undefined, language: Language): string {
  if (!text) return "";
  return text[language.toLowerCase()] ?? text.en ?? "";
}

