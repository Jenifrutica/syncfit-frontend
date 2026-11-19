"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Barbell, Flame, Pill, Target } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { EmptyState, SkeletonGroup } from "@/components/ui/States";
import { EsqueletoLista, EsqueletoTarjeta } from "@/components/ui/Esqueletos";
import { SkyShell } from "@/components/brand/SkyShell";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Pulsi } from "@/components/mascot/Pulsi";
import { getCatalog, getMachines, getShared, getSupplementCatalog, type SharedProfile } from "@/lib/api";
import { faseLabel, isFase } from "@/lib/fases";
import { trimesterOfWeek } from "@/lib/cycle";
import { localized, t, tf } from "@/lib/i18n";
import { useOptions } from "@/lib/options";
import { useSession } from "@/lib/session";

type Item = { name?: string; series?: number; reps?: number; blocked?: boolean };
type SharedDay = { date?: string; label?: Record<string, string>; note?: Record<string, string> };

/** Read-only view of what the athlete chose to share (no session needed). */
export function SharedScreen() {
  const { language } = useSession();
  const options = useOptions();
  const pathname = usePathname();
  // Static export: the token travels as ?token=... (the old /compartido/<token>
  // path was a dynamic route and returned 500). The path branch keeps legacy
  // links working in development.
  const [token, setToken] = useState("");
  const [shared, setShared] = useState<SharedProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fromPath = pathname.split("/").filter(Boolean)[1] ?? "";
    const fromQuery =
      typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? "";
    const value = decodeURIComponent(fromQuery || fromPath);
    setToken(value);
    if (!value) setFailed(true);
  }, [pathname]);

  useEffect(() => {
    if (!token) return;
    setFailed(false);
    getShared(token)
      .then(setShared)
      .catch(() => setFailed(true));
  }, [token, language]);

  // Loads, machines and supplements come as ids; translate them to names.
  useEffect(() => {
    if (!shared) return;
    const jobs: Promise<Record<string, string>>[] = [];
    if (shared.loads?.length) jobs.push(getCatalog(language).then((c) => Object.fromEntries(c.map((x) => [x.id, x.name]))));
    if (shared.machines?.length) jobs.push(getMachines(language).then((c) => Object.fromEntries(c.map((x) => [x.id, x.name]))));
    if (shared.supplements?.length) jobs.push(getSupplementCatalog(language).then((c) => Object.fromEntries(c.map((x) => [x.id, x.name]))));
    Promise.all(jobs.map((j) => j.catch(() => ({}))))
      .then((maps) => setNames(Object.assign({}, ...maps)))
      .catch(() => null);
  }, [shared, language]);

  const timeline = (shared?.timeline ?? {}) as { phase?: string; cycle_day?: number; week?: number };
  const progress = ((shared?.profile ?? {}) as { progress?: { streak_days?: number; week_training_days?: number; weekly_goal?: number } }).progress;
  const routine = shared?.routine as { items?: Item[]; total_estimated_minutes?: number } | null | undefined;
  const calendar = shared?.calendar as { month?: string; days?: SharedDay[] } | null | undefined;
  const profileData = (shared?.profile ?? {}) as Record<string, unknown>;
  const profileRows: [string, string][] = [];
  if (typeof profileData.modality === "string") {
    profileRows.push([t(language, "perfil.modalidad.label"), t(language, `perfil.modalidad.${profileData.modality}`)]);
  }
  if (typeof profileData.objective === "string") {
    profileRows.push([t(language, "nutri.objetivo"), options.label("objective", profileData.objective, language)]);
  }
  if (typeof profileData.goal_phase === "string") {
    profileRows.push([t(language, "nutri.etapa"), options.label("goal_phase", profileData.goal_phase, language)]);
  }
  if (typeof profileData.height_cm === "number") profileRows.push([t(language, "onb.altura"), `${profileData.height_cm} cm`]);
  if (typeof profileData.weight_kg === "number") profileRows.push([t(language, "onb.peso"), `${profileData.weight_kg} kg`]);
  if (typeof profileData.body_fat_pct === "number") profileRows.push([t(language, "onb.grasa"), `${profileData.body_fat_pct} %`]);
  if (typeof profileData.daily_calories === "number") profileRows.push([t(language, "onb.calorias"), `${profileData.daily_calories} kcal`]);
  const fase = useMemo(() => (timeline.week ? trimesterOfWeek(timeline.week) : isFase(timeline.phase) ? timeline.phase : null), [timeline.week, timeline.phase]);

  return (
    <div data-fase={fase ?? undefined} className="bg-fase-suave">
      <SkyShell aside={<LanguageSwitcher />}>
        {failed ? (
          <Card className="mt-6">
            <EmptyState mood="dormida" title={t(language, "compartido.error")} />
          </Card>
        ) : !shared ? (
          <SkeletonGroup label={t(language, "app.cargando")} className="mt-6">
            {/* Owner card, then the shared sections. */}
            <EsqueletoTarjeta lineas={1} />
            <EsqueletoTarjeta lineas={3} icono={false} />
            <EsqueletoLista filas={3} />
          </SkeletonGroup>
        ) : (
          <div className="flex flex-col gap-4">
            <Card className="flex items-center gap-4">
              {shared.owner_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shared.owner_photo_url} alt="" width={64} height={64} className="size-16 rounded-full object-cover" />
              ) : (
                <Pulsi mood="feliz" size={64} />
              )}
              <div className="flex flex-col gap-1">
                <p className="text-small font-extrabold text-ink-suave">{t(language, "compartido.titulo")}</p>
                <h1 className="text-h2 font-bold">{shared.owner_display_name}</h1>
                <Badge tone="lavanda" className="self-start">{tf(language, "compartido.soloLectura", { rol: t(language, `rol.${shared.role}`) })}</Badge>
              </div>
            </Card>

            {fase && (
              <Card tone="fase" className="flex items-center gap-4">
                <Pulsi mood="feliz" size={56} color="var(--color-nube)" />
                <div>
                  <h2 className="text-h3 font-bold">{t(language, "compartido.hoy")}</h2>
                  <p className="font-display text-body-lg font-semibold">
                    {timeline.week ? tf(language, "hoy.semana", { n: timeline.week }) : tf(language, "hoy.dia", { n: timeline.cycle_day ?? 0 })} · {faseLabel(fase, language)}
                  </p>
                </div>
              </Card>
            )}

            {profileRows.length > 0 && (
              <Card className="flex flex-col gap-3">
                <h2 className="text-h3 font-bold">{t(language, "permiso.PROFILE")}</h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body">
                  {profileRows.map(([label, value]) => (
                    <div key={label} className="flex flex-col">
                      <dt className="text-small font-extrabold text-ink-suave">{label}</dt>
                      <dd className="font-display font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}

            {calendar?.days?.length ? (
              <Card className="flex flex-col gap-3">
                <h2 className="text-h3 font-bold">{t(language, "permiso.CALENDAR")}</h2>
                <ul className="flex flex-col gap-2">
                  {calendar.days.slice(0, 10).map((day, i) => (
                    <li key={`${day.date}-${i}`} className="flex items-center justify-between gap-3 text-body">
                      <span className="font-bold tabular-nums">{day.date}</span>
                      <span className="text-small font-semibold text-ink-suave">{localized(day.label, language)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {progress?.streak_days !== undefined && (
              <Card className="grid grid-cols-2 gap-3">
                <h2 className="col-span-2 text-h3 font-bold">{t(language, "compartido.progreso")}</h2>
                <p className="flex items-center gap-2 font-display text-body-lg font-semibold"><Flame size={22} weight="bold" aria-hidden="true" />{progress.streak_days === 1 ? t(language, "hoy.rachaUno") : tf(language, "hoy.racha", { n: progress.streak_days })}</p>
                <p className="flex items-center gap-2 font-display text-body-lg font-semibold"><Target size={22} weight="bold" aria-hidden="true" />{tf(language, "hoy.semanaMeta", { n: progress.week_training_days ?? 0, meta: progress.weekly_goal ?? 0 })}</p>
              </Card>
            )}

            {routine?.items?.length ? (
              <Card className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-h3 font-bold">{t(language, "compartido.rutina")}</h2>
                  {routine.total_estimated_minutes ? <Badge tone="nube">{tf(language, "rutina.minutos", { n: Math.round(routine.total_estimated_minutes) })}</Badge> : null}
                </div>
                <ul className="flex flex-col gap-2">
                  {routine.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-ficha bg-rosa-claro px-4 py-3">
                      <span className={item.blocked ? "font-display font-semibold text-ink-suave line-through" : "font-display font-semibold"}>{item.name}</span>
                      <span className="text-small font-extrabold tabular-nums">{item.series} × {item.reps}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {shared.loads?.length ? (
              <Card className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-h3 font-bold"><Barbell size={22} weight="bold" aria-hidden="true" />{t(language, "compartido.cargas")}</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {shared.loads.map((load, i) => (
                    <li key={i} className="flex justify-between gap-3 text-body">
                      <span>{names[String(load.exercise_id)] ?? String(load.exercise_id)}</span>
                      <span className="font-bold tabular-nums">{String(load.weight_kg)} kg</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {shared.machines?.length ? (
              <Card className="flex flex-col gap-3">
                <h2 className="text-h3 font-bold">{t(language, "compartido.maquinas")}</h2>
                <p className="text-body">{shared.machines.map((id) => names[id] ?? id).join(" · ")}</p>
              </Card>
            ) : null}

            {shared.supplements?.length ? (
              <Card className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-h3 font-bold"><Pill size={22} weight="bold" aria-hidden="true" />{t(language, "compartido.suplementos")}</h2>
                <p className="text-body">{shared.supplements.map((s) => names[String(s.supplement_id)] ?? String(s.supplement_id)).join(" · ")}</p>
              </Card>
            ) : null}

            <p className="text-center text-small font-bold text-ink-suave">{t(language, "compartido.pie")}</p>
          </div>
        )}
      </SkyShell>
    </div>
  );
}
