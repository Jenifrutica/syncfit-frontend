"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Barbell, Brain, Heartbeat, QrCode, ShieldCheck, Sparkle, Thermometer } from "@phosphor-icons/react";

import { ButtonLink } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Cloud, CLOUD_PATH } from "@/components/decor/Cloud";
import { DripDivider } from "@/components/decor/DripDivider";
import { Wordmark } from "@/components/brand/Wordmark";
import { Pulsi } from "@/components/mascot/Pulsi";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { DemoFases } from "@/components/landing/DemoFases";
import { useLandingMotion } from "@/components/landing/useLandingMotion";
import { CYCLE_PHASES, faseLabel } from "@/lib/fases";
import { t, type Language } from "@/lib/i18n";
import { homeFor, useSession } from "@/lib/session";

const NAV = [
  { href: "#como", key: "land.nav.como" },
  { href: "#demo", key: "land.nav.demo" },
  { href: "#gimnasios", key: "land.nav.gyms" },
];

/** Paranice-style menu item: the label sits on a cloud. */
function CloudLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="group relative grid h-14 min-w-36 place-items-center px-6 font-display text-button font-semibold no-underline">
      <svg viewBox="0 0 200 110" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full text-nube transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] group-hover:-translate-y-0.5 group-active:scale-95">
        <path d={CLOUD_PATH} fill="currentColor" />
      </svg>
      <span className="relative pt-1">{children}</span>
    </a>
  );
}

function MainCta({ language, size = "lg", className }: { language: Language; size?: "md" | "lg"; className?: string }) {
  const { status, user, profile } = useSession();
  if (status === "ready" && user) {
    return (
      <ButtonLink href={homeFor(user, profile)} size={size} icon={<ArrowRight size={20} weight="bold" />} className={className}>
        {t(language, "land.abrirApp")}
      </ButtonLink>
    );
  }
  return (
    <ButtonLink href="/entrar?modo=crear" size={size} className={className}>
      {t(language, "land.cta")}
    </ButtonLink>
  );
}

const PUNTOS = [
  { icon: Heartbeat, key: "p1" },
  { icon: ShieldCheck, key: "p2" },
  { icon: Barbell, key: "p3" },
];

const ESTACIONES = [
  { icon: Thermometer, key: "e1" },
  { icon: Heartbeat, key: "e2" },
  { icon: Brain, key: "e3" },
  { icon: ShieldCheck, key: "e4" },
];

/** Public landing: what SyncFit does, the two AIs, a live demo and the gym pitch. */
export function LandingScreen() {
  const { language, status, user } = useSession();
  const root = useRef<HTMLDivElement>(null);
  useLandingMotion(root);
  const signedIn = status === "ready" && !!user;

  return (
    <div ref={root} className="overflow-x-clip">
      {/* ---------- Sky: nav + hero ---------- */}
      <div className="relative flex min-h-svh flex-col">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div data-nube="1.2" className="absolute top-[18%] -left-20 sm:left-[3%]"><Cloud className="text-nube/80" width={260} /></div>
          <div data-nube="0.7" className="absolute top-[52%] -right-24 sm:right-[4%]"><Cloud className="text-nube/70" width={230} /></div>
          <div data-nube="1.6" className="absolute bottom-[6%] left-[14%] max-sm:hidden"><Cloud className="text-nube/90" width={300} /></div>
          <div data-nube="0.9" className="absolute top-[12%] right-[22%] max-lg:hidden"><Cloud className="text-nube/60" width={140} /></div>
          {[
            { left: "4%", delay: "0s", color: "var(--color-folicular)", className: "" },
            { left: "88%", delay: "2.4s", color: "var(--color-menstrual)", className: "" },
            { left: "70%", delay: "4.6s", color: "var(--color-lutea)", className: "max-md:hidden" },
          ].map((p) => (
            <span key={p.left} className={`absolute bottom-0 animate-elevar motion-reduce:hidden ${p.className}`} style={{ left: p.left, animationDelay: p.delay }}>
              <Pulsi size={38} wings color={p.color} />
            </span>
          ))}
        </div>

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
          <Wordmark />
          <nav aria-label="SyncFit" className="flex items-center gap-1 max-lg:hidden">
            {NAV.map((item) => (
              <CloudLink key={item.href} href={item.href}>{t(language, item.key)}</CloudLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!signedIn && (
              <ButtonLink href="/entrar" variant="fantasma" size="sm">
                {t(language, "land.entrar")}
              </ButtonLink>
            )}
            <MainCta language={language} size="md" className="max-sm:hidden" />
          </div>
        </header>

        <main id="contenido" className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pt-4 pb-12 text-center">
          <div data-entra className="relative mb-4 flex flex-col items-center [@media(max-height:720px)]:-mt-4 [@media(max-height:720px)]:mb-0 [@media(max-height:720px)]:scale-80">
            <SpeechBubble tail="abajo" className="mb-3 -rotate-2">{t(language, "land.hero.burbuja")}</SpeechBubble>
            <div className="animate-flotar">
              <Pulsi size={132} wings animated mood="feliz" color="var(--color-ovulatoria)" title="Pulsi" />
            </div>
          </div>
          <h1 data-entra className="max-w-[14ch] text-balance font-display text-display font-bold">
            {t(language, "land.hero.titulo")}
          </h1>
          <p data-entra className="mt-5 max-w-[46ch] text-pretty text-body-lg text-ink-suave">
            {t(language, "land.hero.sub")}
          </p>
          <div data-entra className="mt-8 flex flex-wrap items-center justify-center gap-3 [@media(max-height:720px)]:mt-6">
            <MainCta language={language} />
            <ButtonLink href="#como" variant="secundario" size="lg">
              {t(language, "land.hero.ver")}
            </ButtonLink>
          </div>
        </main>
      </div>

      {/* ---------- Problem (lavanda) ---------- */}
      <DripDivider variant="gotea" className="bg-lavanda text-rosa" />
      <section aria-labelledby="problema" className="bg-lavanda px-4 py-16 text-lavanda-texto sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 id="problema" data-revela className="max-w-[24ch] text-balance font-display text-h1 font-bold text-nube">
            {t(language, "land.problema.titulo")}
          </h2>
          <p data-revela className="mt-5 max-w-[60ch] text-body-lg">{t(language, "land.problema.texto")}</p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {PUNTOS.map(({ icon: Icon, key }) => (
              <li key={key} data-revela className="rounded-nube bg-lavanda-noche p-6">
                <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-crema text-ink">
                  <Icon size={24} weight="bold" />
                </span>
                <h3 className="mt-4 font-display text-h3 font-bold text-nube">{t(language, `land.${key}.t`)}</h3>
                <p className="mt-2 text-body">{t(language, `land.${key}.d`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <DripDivider variant="sube" className="bg-lavanda text-rosa" />

      {/* ---------- Phases ---------- */}
      <section aria-labelledby="fases" className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 id="fases" data-revela className="text-center font-display text-h1 font-bold">{t(language, "land.fases.titulo")}</h2>
          <p data-revela className="mx-auto mt-4 max-w-[48ch] text-center text-body-lg text-ink-suave">{t(language, "land.fases.sub")}</p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CYCLE_PHASES.map((fase, i) => (
              <li key={fase} data-fase={fase} data-revela className="flex flex-col rounded-nube bg-fase-suave p-6">
                <div className="flex items-end justify-between gap-2">
                  <h3 className="font-display text-h3 font-bold">{faseLabel(fase, language)}</h3>
                  <span className={i % 2 ? "animate-flotar [animation-delay:1.2s]" : "animate-flotar"}>
                    <Pulsi size={64} mood={fase === "MENSTRUAL" ? "cansada" : fase === "LUTEAL" ? "dormida" : "feliz"} />
                  </span>
                </div>
                <p className="mt-3 text-body">{t(language, `land.fase.${fase}`)}</p>
              </li>
            ))}
          </ul>
          <div data-fase="TRIMESTER_2" data-revela className="mt-4 flex flex-col items-start gap-4 rounded-nube bg-fase-suave p-6 sm:flex-row sm:items-center">
            <Pulsi size={72} mood="feliz" />
            <div>
              <h3 className="font-display text-h3 font-bold">{t(language, "land.embarazo.titulo")}</h3>
              <p className="mt-1 text-body">{t(language, "land.embarazo.texto")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Two AIs and a guardian ---------- */}
      <section id="como" aria-labelledby="como-titulo" className="scroll-mt-4 bg-crema px-4 py-16 sm:rounded-cielo sm:py-24 lg:mx-4">
        <div className="mx-auto max-w-6xl">
          <h2 id="como-titulo" data-revela className="font-display text-h1 font-bold">{t(language, "land.como.titulo")}</h2>
          <p data-revela className="mt-4 max-w-[52ch] text-body-lg text-ink-suave">{t(language, "land.como.sub")}</p>

          <div data-ruta className="relative mt-12 pl-16 lg:pt-20 lg:pl-0">
            {/* Track: vertical on phones, horizontal on desktop */}
            <div aria-hidden="true" className="absolute top-0 bottom-0 left-[1.625rem] w-1.5 rounded-full bg-nube lg:top-[2.375rem] lg:right-0 lg:bottom-auto lg:left-0 lg:h-1.5 lg:w-auto">
              <div data-ruta-relleno className="size-full origin-top rounded-full bg-ink lg:origin-left" />
            </div>
            <div data-ruta-viajera aria-hidden="true" className="absolute top-0 left-0 lg:top-0">
              <Pulsi size={58} wings color="var(--color-folicular)" />
            </div>
            <ol className="relative grid gap-6 lg:grid-cols-4">
              {ESTACIONES.map(({ icon: Icon, key }, i) => (
                <li key={key} data-estacion className="group rounded-nube bg-nube p-6 shadow-nube transition-opacity duration-300 data-[espera]:opacity-70">
                  <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-ink text-nube transition-colors duration-300 group-data-[espera]:bg-rosa-claro group-data-[espera]:text-ink">
                    <Icon size={24} weight="bold" />
                  </span>
                  <p className="mt-4 text-caption font-extrabold tracking-wide text-ink-suave uppercase tabular-nums">0{i + 1}</p>
                  <h3 className="font-display text-h3 font-bold">{t(language, `land.${key}.t`)}</h3>
                  <p className="mt-2 text-body">{t(language, `land.${key}.d`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Live demo ---------- */}
      <section id="demo" aria-labelledby="demo-titulo" className="scroll-mt-4 px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div className="lg:sticky lg:top-12">
            <h2 id="demo-titulo" data-revela className="font-display text-h1 font-bold">{t(language, "land.demo.titulo")}</h2>
            <p data-revela className="mt-4 max-w-[44ch] text-body-lg text-ink-suave">{t(language, "land.demo.sub")}</p>
            <div data-revela className="mt-6 flex items-center gap-3 max-lg:hidden">
              <Pulsi size={88} mood="feliz" color="var(--color-lutea)" />
              <SpeechBubble>{t(language, "land.demo.burbuja")}</SpeechBubble>
            </div>
          </div>
          <div data-revela>
            <DemoFases language={language} />
          </div>
        </div>
      </section>

      {/* ---------- Gyms ---------- */}
      <section id="gimnasios" aria-labelledby="gyms-titulo" className="scroll-mt-4 px-4 pb-16 sm:pb-24">
        <div data-revela className="mx-auto grid max-w-6xl items-center gap-8 rounded-cielo bg-ink p-8 text-lavanda-texto sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 id="gyms-titulo" className="font-display text-h1 font-bold text-nube">{t(language, "land.gyms.titulo")}</h2>
            <p className="mt-4 max-w-[48ch] text-body-lg">{t(language, "land.gyms.texto")}</p>
            <ButtonLink href="/entrar" variant="secundario" size="lg" className="mt-8">
              {t(language, "land.gyms.cta")}
            </ButtonLink>
          </div>
          <div aria-hidden="true" className="relative mx-auto w-full max-w-sm">
            <div className="rounded-nube bg-lavanda-noche p-6">
              <div className="flex items-center gap-4">
                <span className="grid size-20 place-items-center rounded-ficha bg-nube text-ink"><QrCode size={56} weight="bold" /></span>
                <p className="font-display text-h2 font-bold tracking-[0.2em] text-crema tabular-nums">4E8F5A</p>
              </div>
              <ul className="mt-5 flex flex-col gap-2">
                {["machine", "smith", "cable"].map((k) => t(language, `equipo.${k}`)).map((m) => (
                  <li key={m} className="flex items-center gap-3 rounded-ficha bg-ink/40 px-4 py-3 font-semibold text-nube">
                    <Barbell size={20} weight="bold" className="text-crema" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -top-8 -right-4 animate-flotar">
              <Pulsi size={64} wings color="var(--color-gestacion)" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Final CTA + footer ---------- */}
      <section aria-labelledby="final" className="relative px-4 pt-8 pb-20 text-center sm:pb-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <div data-revela className="animate-flotar">
            <Pulsi size={96} wings color="var(--color-menstrual)" />
          </div>
          <h2 id="final" data-revela className="mt-4 max-w-[22ch] text-balance font-display text-h1 font-bold">{t(language, "land.final.titulo")}</h2>
          <div data-revela className="mt-8">
            <MainCta language={language} />
          </div>
        </div>
      </section>
      <DripDivider variant="gotea" className="bg-ink text-rosa" />
      <footer className="bg-ink px-4 pt-10 pb-12 text-lavanda-texto">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="text-nube">
            <Wordmark />
            <p className="mt-4 max-w-[52ch] text-small text-lavanda-texto">{t(language, "land.final.aviso")}</p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <nav aria-label="SyncFit" className="flex flex-wrap gap-x-6 gap-y-2">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center font-semibold text-nube underline-offset-4 hover:underline">{t(language, item.key)}</a>
              ))}
              <Link href="/entrar" className="inline-flex min-h-11 items-center font-semibold text-nube underline-offset-4 hover:underline">{t(language, "land.entrar")}</Link>
            </nav>
            <LanguageSwitcher className="w-56" />
            <p className="flex items-center gap-2 text-caption">
              <Sparkle size={14} weight="bold" aria-hidden="true" /> SyncFit Edge · 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
