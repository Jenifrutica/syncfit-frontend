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

export function localized(text: Record<string, string> | undefined, language: Language): string {
  if (!text) return "";
  return text[language.toLowerCase()] ?? text.en ?? "";
}

