"use client";

import { AuthUser } from "@/lib/api";
import { LANGUAGES, LANGUAGE_LABELS, Language, t } from "@/lib/i18n";
import { Flower } from "@/components/icons";
import { AdminPanel } from "@/components/admin/AdminPanel";

/**
 * Dedicated shell for SUPER_ADMIN and GYM_ADMIN.
 * Admins do NOT use the athlete flow (no onboarding, cycle, routine or
 * supplements). They only manage gym admins (super) and their gyms/machines.
 */
export function AdminShell({
  user,
  language,
  setLanguage,
  onLogout,
}: {
  user: AuthUser;
  language: Language;
  setLanguage: (l: Language) => void;
  onLogout: () => void;
}) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flower size={22} className="text-pink-500" />
          <div>
            <h1 className="text-xl font-bold text-pink-700">SyncFit Edge · {t(language, "adminTitle")}</h1>
            <p className="text-sm text-slate-600">
              {user.display_name} · {user.role === "SUPER_ADMIN" ? t(language, "adminSuperAdmin") : t(language, "adminGymAdmin")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="rounded border border-pink-200 px-2 py-1 text-sm">
            {LANGUAGES.map((lang) => (<option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>))}
          </select>
          <button onClick={onLogout} className="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-800">{t(language, "logout")}</button>
        </div>
      </header>
      <AdminPanel user={user} language={language} />
    </main>
  );
}

export default AdminShell;
