"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Barbell, Drop, Flame, Heartbeat, Leaf, Moon, Plus, Sun, Target, type Icon } from "@phosphor-icons/react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/States";
import { StoryCard } from "@/components/ui/StoryCard";
import { DripDivider } from "@/components/decor/DripDivider";
import { CycleRing } from "@/components/cycle/CycleRing";
import { WeekStrip, type WeekDay } from "@/components/cycle/WeekStrip";
import { Pulsi, type PulsiMood } from "@/components/mascot/Pulsi";
import { FeelingSheet } from "@/components/hoy/FeelingSheet";
import { NAV } from "@/components/app/AppShell";
import { getCalendar, getStats, getSymptoms, type CalendarDay, type Stats, type SymptomInfo } from "@/lib/api";
import { cycleSegments, currentFase, daysUntilPeriod, greetingKey, monthsOf, weekDates } from "@/lib/cycle";
import { fromISODate, todayISO } from "@/lib/dates";
import { readEnergy } from "@/lib/energia";
import { faseLabel, isFase } from "@/lib/fases";
import { localized, t, tf, type Language } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const LOCALE: Record<Language, string> = { ES: "es", EN: "en", ZH: "zh-CN" };

const KIND_ICON: Record<CalendarDay["kind"], Icon> = {
  CYCLE: Drop,
  OVULATION: Sun,
  STRENGTH: Barbell,
  LOW_IMPACT: Leaf,
  REST: Moon,
};

export function HoyScreen() {
  const { user, profile, language } = useSession();
  const today = todayISO();
  const timeline = profile?.timeline;
  const pregnant = timeline?.modality === "GESTATIONAL";

  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomInfo[]>([]);
  const [failed, setFailed] = useState(false);
  const [selectedDay, setSelectedDay] = useState(today);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [energy, setEnergy] = useState(() => (typeof window === "undefined" ? null : readEnergy(today)));

  const week = useMemo(() => weekDates(today), [today]);

  const load = useCallback(async () => {
    setFailed(false);
    const months = [...new Set([today.slice(0, 7), ...monthsOf(week)])];
    try {
      const [calendars, nextStats] = await Promise.all([Promise.all(months.map((m) => getCalendar(m, language))), getStats()]);
      setCalendar(calendars.flatMap((c) => c.days));
      setStats(nextStats);
    } catch {
      setFailed(true);
    }
    getSymptoms(language).then(setSymptoms).catch(() => setSymptoms([]));
  }, [language, today, week]);

  useEffect(() => {
    void load();
  }, [load]);

  const byDate = useMemo(() => new Map(calendar.map((day) => [day.date, day])), [calendar]);
  const fase = currentFase(timeline, calendar, today);
  const selected = byDate.get(selectedDay);
  const hasBlockingSymptom = symptoms.some((s) => s.block_training && profile?.symptoms?.includes(s.id));

  const mood: PulsiMood = hasBlockingSymptom
    ? "alerta"
    : energy === "NO_ENERGY" || (profile?.pain_levels?.OVERALL ?? 0) >= 6
      ? "cansada"
      : selected?.kind === "REST"
        ? "dormida"
        : "feliz";

  const dayFormat = new Intl.DateTimeFormat(LOCALE[language], { weekday: "long", day: "numeric", month: "long" });
  const weekdayFormat = new Intl.DateTimeFormat(LOCALE[language], { weekday: "narrow" });
  const days: WeekDay[] = week.map((date) => {
    const info = byDate.get(date);
    const dayFase = isFase(info?.phase) ? info.phase : undefined;
    return {
      key: date,
      weekday: weekdayFormat.format(fromISODate(date)).toUpperCase(),
      day: fromISODate(date).getDate(),
      fase: dayFase,
      label: [dayFormat.format(fromISODate(date)), dayFase ? faseLabel(dayFase, language) : null].filter(Boolean).join(", "),
    };
  });

  const position = pregnant ? (timeline?.week ?? 1) : (timeline?.cycle_day ?? 1);
  const total = pregnant ? 40 : (timeline?.cycle_length_days ?? 28);
  const faseName = fase ? faseLabel(fase, language) : "";
  const untilPeriod = daysUntilPeriod(timeline);
  const countdown = pregnant
    ? tf(language, "hoy.faltanSemanas", { n: Math.max(0, 40 - position) })
    : untilPeriod === null
      ? ""
      : untilPeriod === 0
        ? t(language, "hoy.periodoHoy")
        : untilPeriod === 1
          ? t(language, "hoy.periodoManana")
          : tf(language, "hoy.periodoEn", { n: untilPeriod });

  const KindIcon = selected ? KIND_ICON[selected.kind] : null;
  const firstName = user?.display_name.split(" ")[0] ?? "";
  const routineHref = NAV.find((item) => item.key === "rutina")?.href ?? "/app";

  return (
    <div className="lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-2 lg:items-start lg:gap-8 lg:p-8">
      <section aria-labelledby="hoy-titulo" className="bg-fase-suave px-4 pt-5 pb-4 sm:px-8 lg:sticky lg:top-8 lg:rounded-cielo lg:py-8">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <header className="flex items-center justify-between gap-3">
            <div>
              <h1 id="hoy-titulo" className="text-h2 font-bold">
                {t(language, greetingKey(new Date().getHours()))}, {firstName}
              </h1>
              <p className="text-small font-extrabold text-ink-suave first-letter:uppercase">{dayFormat.format(fromISODate(today))}</p>
            </div>
            <Link
              href={NAV.find((item) => item.key === "perfil")?.href ?? "/app"}
              aria-label={t(language, "hoy.perfil")}
              className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-nube font-display text-h3 font-bold no-underline"
            >
              {profile?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photo_url} alt="" width={48} height={48} className="size-full object-cover" />
              ) : (
                <span aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
              )}
            </Link>
          </header>

          <WeekStrip days={days} selected={selectedDay} onSelect={setSelectedDay} />

          <div className="flex flex-col items-center gap-2 pt-1">
            <CycleRing
              segments={cycleSegments(timeline, calendar)}
              position={position}
              label={pregnant ? tf(language, "hoy.anilloGest", { n: position, fase: faseName }) : tf(language, "hoy.anillo", { n: position, total, fase: faseName })}
            >
              <Pulsi mood={mood} size={74} animated />
              <span className="font-display text-h2 leading-none font-bold">{tf(language, pregnant ? "hoy.semana" : "hoy.dia", { n: position })}</span>
              <span className="text-small font-extrabold">{faseName}</span>
            </CycleRing>
            {countdown && <p className="text-body font-bold text-ink-suave">{countdown}</p>}
          </div>
        </div>
      </section>
      <DripDivider variant="gotea" className="bg-rosa text-fase-suave lg:hidden" />

      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-2 sm:px-8 lg:w-full lg:px-0 lg:pt-0">
        {selected && KindIcon && (
          <Card aria-live="polite" className="flex items-start gap-4">
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-fase-suave" data-fase={selected.phase}>
              <KindIcon size={24} weight="bold" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-h3 font-bold">
                {localized(selected.label, language)}
                {selectedDay !== today && <span className="font-sans text-small font-bold text-ink-suave first-letter:uppercase"> · {dayFormat.format(fromISODate(selectedDay))}</span>}
              </h2>
              {selected.note && <p className="text-body text-ink-suave">{localized(selected.note, language)}</p>}
            </div>
          </Card>
        )}

        <ButtonLink href={routineHref} size="lg" fullWidth icon={<Heartbeat size={22} weight="bold" />}>
          {t(language, "hoy.escanear")}
        </ButtonLink>
        <Button variant="secundario" size="lg" fullWidth icon={<Plus size={20} weight="bold" />} onClick={() => setSheetOpen(true)}>
          {t(language, "hoy.registrar")}
        </Button>

        {failed ? (
          <Card className="flex flex-col items-start gap-3">
            <p role="alert" className="text-body font-bold">
              {t(language, "hoy.error")}
            </p>
            <Button variant="suave" size="sm" onClick={() => void load()}>
              {t(language, "comun.reintentar")}
            </Button>
          </Card>
        ) : stats ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <StoryCard tone="crema" className="w-auto" icon={<Flame size={26} weight="bold" />} title={stats.streak_days === 0 ? t(language, "hoy.rachaCero") : stats.streak_days === 1 ? t(language, "hoy.rachaUno") : tf(language, "hoy.racha", { n: stats.streak_days })}>
              {stats.today_trained ? t(language, "hoy.entrenaste") : null}
            </StoryCard>
            <StoryCard tone="fase-suave" className="w-auto" icon={<Target size={26} weight="bold" />} title={tf(language, "hoy.semanaMeta", { n: stats.week_training_days, meta: stats.weekly_goal })}>
              {stats.rest_days_left > 0 ? tf(language, "hoy.descansos", { n: stats.rest_days_left }) : null}
            </StoryCard>
          </div>
        ) : (
          <div role="status" aria-busy="true" className="grid gap-3 sm:grid-cols-2">
            <span className="sr-only">{t(language, "hoy.cargando")}</span>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        )}

        {fase && (
          <StoryCard tone="lavanda" className="w-auto" icon={<Pulsi mood="feliz" size={40} />} title={t(language, `hoy.consejo.${fase}`)} />
        )}
      </div>

      <FeelingSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEnergy(readEnergy(today));
        }}
        symptoms={symptoms}
        today={today}
      />
    </div>
  );
}
