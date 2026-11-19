"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

import { Wordmark } from "@/components/brand/Wordmark";
import { Cloud } from "@/components/decor/Cloud";
import { Pulsi } from "@/components/mascot/Pulsi";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import type { LegalDoc } from "@/lib/legal";
import { t, type Language } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/** Long-form legal text (privacy, terms) in the brand: pink sky, one readable card, numbered sections. */
export function LegalPage({ doc }: { doc: Record<Language, LegalDoc> }) {
  const { language } = useSession();
  const d = doc[language];
  return (
    <div className="relative min-h-svh overflow-x-clip pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Cloud className="absolute top-24 -left-16 text-nube/70 sm:left-[4%]" width={240} />
        <Cloud className="absolute top-[40%] -right-20 text-nube/60 sm:right-[4%]" width={200} />
      </div>
      <header className="relative mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
        <Wordmark />
        <LanguageSwitcher />
      </header>

      <main className="relative mx-auto mt-8 w-full max-w-3xl px-4">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-display font-semibold underline-offset-4 hover:underline">
          <ArrowLeft size={18} weight="bold" aria-hidden="true" />
          {t(language, "legal.volver")}
        </Link>
        <div className="mt-4 flex items-end justify-between gap-4">
          <h1 className="font-display text-h1 font-bold text-balance">{d.titulo}</h1>
          <Pulsi size={72} mood="feliz" color="var(--color-lutea)" className="shrink-0 max-sm:hidden" />
        </div>
        <p className="mt-2 text-small font-bold text-ink-suave">{d.actualizado}</p>

        <article className="mt-6 rounded-nube bg-nube p-6 shadow-nube sm:p-10">
          <p className="text-body-lg">{d.intro}</p>
          <nav aria-label={t(language, "legal.indice")} className="mt-6 rounded-ficha bg-rosa-claro p-5">
            <p className="font-display text-h3 font-bold">{t(language, "legal.indice")}</p>
            <ol className="mt-2 grid gap-1 sm:grid-cols-2">
              {d.secciones.map((s, i) => (
                <li key={s.titulo}>
                  <a href={`#s${i + 1}`} className="inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
                    {i + 1}. {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          {d.secciones.map((s, i) => (
            <section key={s.titulo} id={`s${i + 1}`} className="mt-10 scroll-mt-6">
              <h2 className="flex items-baseline gap-3 font-display text-h2 font-bold">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-lutea-suave text-h3 tabular-nums">{i + 1}</span>
                {s.titulo}
              </h2>
              {s.parrafos.map((p) => (
                <p key={p} className="mt-3 max-w-prose text-body">{p}</p>
              ))}
              {s.lista && (
                <ul className="mt-3 flex max-w-prose list-disc flex-col gap-2 pl-6 text-body marker:text-lavanda">
                  {s.lista.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
