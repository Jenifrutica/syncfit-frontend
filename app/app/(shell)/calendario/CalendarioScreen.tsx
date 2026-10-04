"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight, CheckCircle, Flame, Target } from "@phosphor-icons/react";

import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton, SkeletonGroup } from "@/components/ui/States";
import { StoryCard } from "@/components/ui/StoryCard";
import { KIND_ICON, PhaseMonth } from "@/components/calendario/PhaseMonth";
import { getCalendar, getStats, type CalendarDay, type Stats } from "@/lib/api";
import { fromISODate, todayISO } from "@/lib/dates";
import { CYCLE_PHASES, FASE_COLOR, TRIMESTERS, faseLabel, isFase } from "@/lib/fases";
import { localized, t, tf, type Language } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const LOCALE: Record<Language, string> = { ES: "es", EN: "en", ZH: "zh-CN" };
const KINDS: CalendarDay["kind"][] = ["CYCLE", "OVULATION", "STRENGTH", "LOW_IMPACT", "REST"];

function shiftMonth(month: string, delta: number): string {
  const d = fromISODate(`${month}-01`);
  const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

export function CalendarioScreen() {
  const { profile, language } = useSession();
  const today = todayISO();
  const pregnant = profile?.modality === "GESTATIONAL";
  const [month, setMonth] = useState(today.slice(0, 7));
  const [days, setDays] = useState<CalendarDay[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(today);

  const load = useCallback(async () => {
    setFailed(false);
    setDays(null);
    try {
      const [calendar, nextStats] = await Promise.all([getCalendar(month, language), getStats()]);
      setDays(calendar.days);
      setStats(nextStats);
    } catch {
      setFailed(true);
    }
  }, [month, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const trained = useMemo(() => new Set(stats?.training_dates ?? []), [stats]);
  const info = days?.find((d) => d.date === selected);
  const infoFase = isFase(info?.phase) ? info.phase : null;
  const InfoIcon = info ? KIND_ICON[info.kind] : null;
  const monthLabel = new Intl.DateTimeFormat(LOCALE[language], { month: "long", year: "numeric" }).format(fromISODate(`${month}-01`));
  const dayLabel = new Intl.DateTimeFormat(LOCALE[language], { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pt-6 sm:px-8 lg:pt-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold">{t(language, "cal.titulo")}</h1>
        <p className="text-body-lg font-bold text-ink-suave">{t(language, "cal.sub")}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <IconButton label={t(language, "cal.anterior")} variant="suave" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
              <CaretLeft size={18} weight="bold" />
            </IconButton>
            <h2 aria-live="polite" className="text-h3 font-bold first-letter:uppercase">
              {monthLabel}
            </h2>
            <IconButton label={t(language, "cal.siguiente")} variant="suave" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
              <CaretRight size={18} weight="bold" />
            </IconButton>
          </div>

          {failed ? (
            <div className="flex flex-col items-start gap-3">
              <p role="alert" className="text-body font-bold">
                {t(language, "cal.error")}
              </p>
              <Button variant="suave" size="sm" onClick={() => void load()}>
                {t(language, "comun.reintentar")}
              </Button>
            </div>
          ) : days ? (
            <PhaseMonth month={month} days={days} trained={trained} today={today} selected={selected} onSelect={setSelected} language={language} />
          ) : (
            <SkeletonGroup label={t(language, "cal.cargando")}>
              <Skeleton className="aspect-[7/5] w-full" />
            </SkeletonGroup>
          )}

          {month !== today.slice(0, 7) && (
            <Button variant="suave" size="sm" className="self-center" onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); }}>
              {t(language, "cal.hoy")}
            </Button>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {info && (
            <Card aria-live="polite" className="flex items-start gap-4" data-fase={infoFase ?? undefined}>
              {InfoIcon && (
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-fase-suave">
                  <InfoIcon size={24} weight="bold" />
                </span>
              )}
              <div className="flex flex-col gap-1">
                <p className="text-small font-extrabold text-ink-suave first-letter:uppercase">{dayLabel.format(fromISODate(selected))}</p>
                <h2 className="text-h3 font-bold">{localized(info.label, language) || t(language, `kind.${info.kind}`)}</h2>
                <p className="text-small font-bold">
                  {[infoFase ? faseLabel(infoFase, language) : null, info.cycle_day ? tf(language, "cal.diaCiclo", { n: info.cycle_day }) : null].filter(Boolean).join(" · ")}
                </p>
                {info.note && <p className="text-body text-ink-suave">{localized(info.note, language)}</p>}
                {trained.has(selected) && (
                  <p className="flex items-center gap-1.5 text-small font-extrabold text-exito">
                    <CheckCircle size={18} weight="bold" aria-hidden="true" />
                    {t(language, "cal.entrenaste")}
                  </p>
                )}
              </div>
            </Card>
          )}

          {stats && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <StoryCard tone="crema" className="w-auto" icon={<Flame size={26} weight="bold" />} title={stats.streak_days === 0 ? t(language, "hoy.rachaCero") : stats.streak_days === 1 ? t(language, "hoy.rachaUno") : tf(language, "hoy.racha", { n: stats.streak_days })} />
              <StoryCard tone="fase-suave" className="w-auto" icon={<Target size={26} weight="bold" />} title={tf(language, "hoy.semanaMeta", { n: stats.week_training_days, meta: stats.weekly_goal })}>
                {stats.rest_days_left > 0 ? tf(language, "hoy.descansos", { n: stats.rest_days_left }) : null}
              </StoryCard>
            </div>
          )}

          <Card tone="rosa-claro" className="flex flex-col gap-3">
            <h2 className="text-h3 font-bold">{t(language, "cal.leyenda")}</h2>
            <ul className="grid grid-cols-2 gap-2 text-small font-bold">
              {(pregnant ? TRIMESTERS : CYCLE_PHASES).map((fase) => (
                <li key={fase} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-4 shrink-0 rounded-full" style={{ background: FASE_COLOR[fase].base }} />
                  {faseLabel(fase, language)}
                </li>
              ))}
            </ul>
            <ul className="grid grid-cols-2 gap-2 text-small font-bold">
              {KINDS.map((kind) => {
                const KindIcon = KIND_ICON[kind];
                return (
                  <li key={kind} className="flex items-center gap-2">
                    <KindIcon size={16} weight="bold" aria-hidden="true" />
                    {t(language, `kind.${kind}`)}
                  </li>
                );
              })}
              <li className="flex items-center gap-2">
                <span aria-hidden="true" className="grid size-4 place-items-center rounded-full bg-exito text-nube">
                  <CheckCircle size={12} weight="bold" />
                </span>
                {t(language, "cal.entrenaste")}
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
