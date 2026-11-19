"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Barbell, Buildings, CalendarBlank, House, Pill, SignOut, UserCircle, type Icon } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { currentFase } from "@/lib/cycle";
import { todayISO } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/** `short`: label for the phone bottom bar when the full one is too long. */
type NavItem = { key: string; href: string; icon: Icon; short?: string };

/** Sections of the athlete app: the same six in the desktop sidebar and the phone bottom bar. */
export const NAV: NavItem[] = [
  { key: "hoy", href: "/app", icon: House },
  { key: "rutina", href: "/app/rutina", icon: Barbell },
  { key: "calendario", href: "/app/calendario", icon: CalendarBlank },
  { key: "suplementos", href: "/app/nutricion", icon: Pill },
  { key: "gimnasios", href: "/app/gimnasios", icon: Buildings, short: "gimnasiosCorto" },
  { key: "perfil", href: "/app/perfil", icon: UserCircle },
];

function isActive(pathname: string, href: string, desktop = false) {
  const path = href.split("?")[0];
  // Static export uses trailing slashes ("/app/"), the hrefs do not.
  const current = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/app") return current === "/app";
  // On phones gyms live under Profile.
  if (path === "/app/perfil" && !desktop) return current.startsWith(path) || current.startsWith("/app/gimnasios");
  return current.startsWith(path);
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
            const active = isActive(pathname, href, true);
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
        </div>
      </aside>

      {/* Same top bar as the admin panels: sign out always in the top-right corner. */}
      <header className="sticky top-0 z-30 bg-nube/95 shadow-flotante backdrop-blur lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3 lg:invisible">
            {/* Pulsi only on phones, so the language switcher fits on one line. */}
            <Wordmark href="/app" compact />
          </div>
          <div className="flex items-center gap-2">
            <div className="shrink-0 lg:hidden">
              <LanguageSwitcher />
            </div>
            <Button variant="fantasma" size="sm" icon={<SignOut size={18} weight="bold" />} onClick={logout} data-logout>
              <span className="max-sm:sr-only">{t(language, "nav.salir")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="pb-28 lg:pb-10">{children}</div>

      <nav
        aria-label={t(language, "nav.principal")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 rounded-t-nube bg-nube px-0.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-flotante lg:hidden"
      >
        {NAV.map(({ key, href, icon: ItemIcon, short }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-caption no-underline",
                active ? "font-extrabold text-ink" : "font-bold text-ink-suave",
              )}
            >
              <span className={cx("grid h-8 w-12 place-items-center rounded-full", active && "bg-fase-suave")}>
                <ItemIcon size={22} weight={active ? "fill" : "bold"} aria-hidden="true" />
              </span>
              <span className="max-w-full truncate text-[0.75rem] tracking-tight">{t(language, `nav.${short ?? key}`)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
