"use client";

import { ArrowRight, Buildings } from "@phosphor-icons/react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          <DatosCard />
          <CicloCard />
          <Card tone="lavanda" className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Buildings size={28} weight="bold" aria-hidden="true" />
              <h2 className="text-h3 font-bold">{t(language, "perfil.gimnasios")}</h2>
            </div>
            <p className="text-body text-lavanda-texto">{t(language, "perfil.gimnasios.desc")}</p>
            <ButtonLink href="/app/gimnasios" variant="secundario" icon={<ArrowRight size={18} weight="bold" />} className="self-start">
              {t(language, "perfil.gimnasios.ir")}
            </ButtonLink>
          </Card>
          <SintomasCard />
        </div>
        <div className="flex flex-col gap-5">
          <CargasCard />
          <CompartirCard />
          <CuentaCard />
        </div>
      </div>
    </div>
  );
}
