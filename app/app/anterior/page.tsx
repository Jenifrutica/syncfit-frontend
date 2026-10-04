"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Guard } from "@/components/session/Guard";
import { LegacyAthleteApp, type LegacyTab } from "@/components/legacy/LegacyAthleteApp";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const TABS: LegacyTab[] = ["routine", "supplements", "machines", "profile"];

function Previous() {
  const params = useSearchParams();
  const { language } = useSession();
  const requested = params.get("tab");
  const tab = TABS.find((item) => item === requested) ?? "routine";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-4 py-2 text-small font-bold text-nube sobre-oscuro">
        <span>{t(language, "anterior.aviso")}</span>
        <Link href="/app" className="flex items-center gap-1 text-crema">
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          {t(language, "anterior.volver")}
        </Link>
      </div>
      <LegacyAthleteApp key={tab} initialTab={tab} />
    </>
  );
}

/** Previous athlete app, opened on a tab, for sections not redesigned yet. */
export default function PreviousVersionPage() {
  return (
    <Guard allow={["ATHLETE"]} requireProfile>
      <Suspense>
        <Previous />
      </Suspense>
    </Guard>
  );
}
