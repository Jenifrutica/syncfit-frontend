"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SignOut } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Wordmark } from "@/components/brand/Wordmark";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/**
 * Frame for the admin panels: denser than the athlete app (Dashboard
 * profile), same palette and type, a top bar instead of a bottom nav.
 */
export function PanelShell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const { user, language, signOut } = useSession();

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 bg-nube/95 shadow-flotante backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Wordmark href={user?.role === "SUPER_ADMIN" ? "/admin" : "/gym"} />
            {user && <Badge tone="lavanda">{t(language, `admin.rol.${user.role}`)}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="fantasma"
              size="sm"
              icon={<SignOut size={18} weight="bold" />}
              onClick={() => {
                signOut();
                router.replace("/entrar");
              }}
            >
              <span className="max-sm:sr-only">{t(language, "nav.salir")}</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 font-bold">{title}</h1>
            {subtitle && <p className="text-body-lg font-bold text-ink-suave">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
