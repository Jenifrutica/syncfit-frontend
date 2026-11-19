"use client";

import { CargasCard } from "@/components/perfil/CargasCard";
import { CicloCard } from "@/components/perfil/CicloCard";
import { CompartirCard } from "@/components/perfil/CompartirCard";
import { CuentaCard } from "@/components/perfil/CuentaCard";
import { DatosCard } from "@/components/perfil/DatosCard";
import { SintomasCard } from "@/components/perfil/SintomasCard";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/** Everything about the athlete, in two columns on desktop. */
export function PerfilScreen() {
  const { language } = useSession();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pt-6 sm:px-8 lg:pt-10">
      <h1 className="text-h1 font-bold">{t(language, "perfil.titulo")}</h1>
      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        {/* In both columns the last card grows so they end on the same line. */}
        <div className="flex flex-col gap-5 lg:[&>:last-child]:flex-1">
          <DatosCard />
          <CicloCard />
          <SintomasCard />
        </div>
        <div className="flex flex-col gap-5 lg:[&>:last-child]:flex-1">
          <CargasCard />
          <CompartirCard />
          <CuentaCard />
        </div>
      </div>
    </div>
  );
}
