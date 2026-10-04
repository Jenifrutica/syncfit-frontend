"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Barbell, CalendarBlank, House, Pill, SignOut, UserCircle, type Icon } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Wordmark } from "@/components/brand/Wordmark";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { currentFase } from "@/lib/cycle";
import { todayISO } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

type NavItem = { key: string; href: string; icon: Icon };

/**
 * Sections of the athlete app. Items not redesigned yet open the previous
 * version (/app/anterior) on the matching tab; each phase-3 PR points one
 * of them at its new route.
 */
export const NAV: NavItem[] = [
  { key: "hoy", href: "/app", icon: House },
  { key: "rutina", href: "/app/rutina", icon: Barbell },
  { key: "calendario", href: "/app/calendario", icon: CalendarBlank },
  { key: "suplementos", href: "/app/nutricion", icon: Pill },
  { key: "perfil", href: "/app/anterior?tab=profile", icon: UserCircle },
];

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  return path === "/app" ? pathname === "/app" : pathname.startsWith(path);
}

/** Bottom bar on phones, sidebar from 1024 px. The sky takes the phase color. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, language, signOut } = useSession();
  const fase = currentFase(profile?.timeline, [], todayISO());

  const logout = () => {
    signOut();
    router.replace("/entrar");
  };

  return (
    <div data-fase={fase ?? undefined} className="min-h-svh lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col gap-2 bg-nube px-4 py-6 shadow-nube lg:flex">
        <div className="px-3 pb-6">
          <Wordmark href="/app" />
        </div>
        <nav aria-label={t(language, "nav.principal")} className="flex flex-col gap-1">
          {NAV.map(({ key, href, icon: ItemIcon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-12 items-center gap-3 rounded-full px-4 font-display text-body-lg no-underline",
                  active ? "bg-fase-suave font-semibold" : "font-medium hover:bg-rosa-claro",
                )}
              >
                <ItemIcon size={22} weight={active ? "fill" : "bold"} aria-hidden="true" />
                {t(language, `nav.${key}`)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-1">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 items-center gap-2 rounded-full px-4 text-small font-extrabold text-peligro hover:bg-peligro-suave"
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
            {t(language, "nav.salir")}
          </button>
        </div>
      </aside>

      <div className="pb-28 lg:pb-10">{children}</div>

      <nav
        aria-label={t(language, "nav.principal")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 rounded-t-nube bg-nube px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-flotante lg:hidden"
      >
        {NAV.map(({ key, href, icon: ItemIcon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-caption no-underline",
                active ? "font-extrabold text-ink" : "font-bold text-ink-suave",
              )}
            >
              <span className={cx("grid h-8 w-14 place-items-center rounded-full", active && "bg-fase-suave")}>
                <ItemIcon size={22} weight={active ? "fill" : "bold"} aria-hidden="true" />
              </span>
              {t(language, `nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
