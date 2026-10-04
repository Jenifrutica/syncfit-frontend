"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Info, Plus, ShieldCheck, Trash, Warning, WarningOctagon } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Badge, Chip } from "@/components/ui/Chip";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { EmptyState, ProgressBar, Skeleton, SkeletonGroup } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { MacrosCard } from "@/components/nutricion/MacrosCard";
import {
  getSupplementCatalog,
  getSupplementIntakes,
  getSupplements,
  setSupplementIntake,
  updateMyProfile,
  type IntakeRecord,
  type SupplementAdvice,
  type SupplementCatalogItem,
} from "@/lib/api";
import { todayISO } from "@/lib/dates";
import { GOAL_OPTIONS, OBJECTIVE_OPTIONS, goalLabel, localized, objectiveLabel, t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

type Safety = "SAFE" | "CAUTION" | "AVOID";
const SAFETY_TONE: Record<Safety, "exito" | "aviso" | "peligro"> = { SAFE: "exito", CAUTION: "aviso", AVOID: "peligro" };
const SAFETY_ICON = { SAFE: ShieldCheck, CAUTION: Warning, AVOID: WarningOctagon };
const MACRO_KEYS = ["kcal", "protein_g", "carbs_g", "fat_g"] as const;
const MACRO_LABEL: Record<(typeof MACRO_KEYS)[number], string> = { kcal: "kcal", protein_g: "nutri.proteina", carbs_g: "nutri.carbos", fat_g: "nutri.grasa" };

export function NutricionScreen() {
  const { profile, language, setProfile } = useSession();
  const toast = useToast();
  const today = todayISO();
  const pregnant = profile?.modality === "GESTATIONAL";

  const [advice, setAdvice] = useState<SupplementAdvice | null>(null);
  const [catalog, setCatalog] = useState<SupplementCatalogItem[]>([]);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [failed, setFailed] = useState(false);

  const loadAdvice = useCallback(async () => {
    if (!profile) return;
    setFailed(false);
    try {
      setAdvice(
        await getSupplements((profile.modality as "MENSTRUAL_CYCLE" | "GESTATIONAL") ?? "MENSTRUAL_CYCLE", language, profile.objective ?? undefined, {
          goalPhase: profile.goal_phase,
          weightKg: profile.weight_kg,
          heightCm: profile.height_cm,
          bodyFatPct: profile.body_fat_pct,
          age: profile.age,
          dailyCalories: profile.daily_calories,
        }),
      );
    } catch {
      setFailed(true);
    }
  }, [profile, language]);

  useEffect(() => {
    void loadAdvice();
  }, [loadAdvice]);

  useEffect(() => {
    getSupplementCatalog(language).then(setCatalog).catch(() => setCatalog([]));
    getSupplementIntakes(today).then(setIntakes).catch(() => setIntakes([]));
  }, [language, today]);

  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const mine = (profile?.current_supplements ?? []).map((id) => byId.get(id)).filter((c): c is SupplementCatalogItem => !!c);
  const daily = mine.filter((c) => c.is_daily);
  const takenIds = new Set(intakes.filter((i) => i.taken).map((i) => i.supplement_id));
  const takenCount = daily.filter((c) => takenIds.has(c.id)).length;

  const save = async (patch: Record<string, unknown>) => {
    try {
      setProfile(await updateMyProfile(patch));
    } catch {
      toast({ tone: "error", title: t(language, "nutri.errorGuardar"), closeLabel: t(language, "comun.cerrar") });
    }
  };

  const toggleMine = (id: string) => {
    const current = new Set(profile?.current_supplements ?? []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    void save({ current_supplements: [...current] });
  };

  const toggleIntake = async (id: string) => {
    const next = !takenIds.has(id);
    setIntakes((list) => [...list.filter((i) => i.supplement_id !== id), { supplement_id: id, date: today, taken: next }]);
    try {
      await setSupplementIntake(id, today, next);
    } catch {
      setIntakes((list) => [...list.filter((i) => i.supplement_id !== id), { supplement_id: id, date: today, taken: !next }]);
      toast({ tone: "error", title: t(language, "nutri.errorGuardar"), closeLabel: t(language, "comun.cerrar") });
    }
  };

  const saveMacro = (id: string, key: (typeof MACRO_KEYS)[number], value: number) => {
    const list = [...(profile?.supplement_macros ?? [])];
    const existing = list.find((m) => m.supplement_id === id)?.macros ?? { protein_g: 0, carbs_g: 0, fat_g: 0, kcal: 0 };
    if (existing[key] === value) return;
    void save({ supplement_macros: [...list.filter((m) => m.supplement_id !== id), { supplement_id: id, macros: { ...existing, [key]: value } }] });
  };

  const pregnancyNote = (item: SupplementCatalogItem | undefined) =>
    pregnant && item && (item.safety_pregnancy === "AVOID" || item.safety_pregnancy === "CAUTION") ? (
      <Badge tone={item.safety_pregnancy === "AVOID" ? "peligro" : "aviso"} icon={<WarningOctagon size={14} weight="bold" />}>
        {t(language, `nutri.embarazo.${item.safety_pregnancy}`)}
      </Badge>
    ) : null;

  const notMine = catalog.filter((c) => !(profile?.current_supplements ?? []).includes(c.id));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pt-6 sm:px-8 lg:pt-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold">{t(language, "nutri.titulo")}</h1>
        <p className="text-body-lg font-bold text-ink-suave">{t(language, "nutri.sub")}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Field label={t(language, "nutri.objetivo")}>
              {(control) => (
                <Select {...control} value={profile?.objective ?? ""} onChange={(e) => void save({ objective: e.target.value })}>
                  {OBJECTIVE_OPTIONS.filter((o) => pregnant || o !== "GESTATIONAL_HEALTH").map((o) => (
                    <option key={o} value={o}>
                      {objectiveLabel(language, o)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t(language, "nutri.etapa")}>
              {(control) => (
                <Select {...control} value={profile?.goal_phase ?? ""} onChange={(e) => void save({ goal_phase: e.target.value })}>
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {goalLabel(language, g)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </Card>

          {failed ? (
            <Card className="flex flex-col items-start gap-3">
              <p role="alert" className="text-body font-bold">
                {t(language, "nutri.error")}
              </p>
              <Button variant="suave" size="sm" onClick={() => void loadAdvice()}>
                {t(language, "comun.reintentar")}
              </Button>
            </Card>
          ) : advice?.daily_macros ? (
            <MacrosCard macros={advice.daily_macros} language={language} />
          ) : (
            <SkeletonGroup label={t(language, "nutri.cargando")}>
              <Skeleton className="h-44" />
            </SkeletonGroup>
          )}

          <section aria-labelledby="mis-suplementos" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="mis-suplementos" className="text-h2 font-bold">
                {t(language, "nutri.mios")}
              </h2>
              {daily.length > 0 && <span className="text-small font-extrabold tabular-nums">{tf(language, "nutri.tomados", { n: takenCount, total: daily.length })}</span>}
            </div>
            {daily.length > 0 && <ProgressBar value={takenCount} max={daily.length} label={tf(language, "nutri.tomados", { n: takenCount, total: daily.length })} />}

            {mine.length === 0 ? (
              <Card>
                <EmptyState mood="feliz" title={t(language, "nutri.ninguno")} />
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {mine.map((item) => {
                  const taken = takenIds.has(item.id);
                  const macros = profile?.supplement_macros?.find((m) => m.supplement_id === item.id)?.macros;
                  return (
                    <li key={item.id}>
                      <Card padding="sm" className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-h3 font-bold">{item.name}</h3>
                            <p className="text-small font-bold text-ink-suave">
                              {item.dosage}
                              {item.frequency ? ` · ${t(language, `frecuencia.${item.frequency}`)}` : ""}
                            </p>
                            {pregnancyNote(item)}
                          </div>
                          <IconButton label={tf(language, "nutri.quitar", { nombre: item.name })} variant="suave" onClick={() => toggleMine(item.id)}>
                            <Trash size={18} weight="bold" />
                          </IconButton>
                        </div>
                        {item.is_daily && (
                          <button
                            type="button"
                            aria-pressed={taken}
                            onClick={() => void toggleIntake(item.id)}
                            className={cx(
                              "flex min-h-12 items-center justify-center gap-2 rounded-full font-display text-button font-semibold transition-transform duration-[var(--dur-toque)] active:scale-[0.97]",
                              taken ? "bg-exito-suave text-exito" : "bg-ink text-nube",
                            )}
                          >
                            <Check size={20} weight="bold" aria-hidden="true" />
                            {taken ? t(language, "nutri.tomado") : t(language, "nutri.marcar")}
                          </button>
                        )}
                        <details className="rounded-ficha bg-rosa-claro px-4 py-2">
                          <summary className="min-h-10 py-1 text-small font-extrabold">{t(language, "nutri.porcion")}</summary>
                          <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-4">
                            {MACRO_KEYS.map((key) => (
                              <label key={key} className="flex flex-col gap-1 text-caption font-extrabold">
                                {key === "kcal" ? "kcal" : t(language, MACRO_LABEL[key])}
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  defaultValue={macros ? macros[key] : item.macros[key]}
                                  onBlur={(e) => saveMacro(item.id, key, Number(e.target.value) || 0)}
                                  className="min-h-11 px-3 tabular-nums"
                                />
                              </label>
                            ))}
                          </div>
                        </details>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}

            {notMine.length > 0 && (
              <details className="rounded-nube bg-nube p-5">
                <summary className="flex items-center gap-2 font-display text-h3 font-bold">
                  <Plus size={20} weight="bold" aria-hidden="true" />
                  {t(language, "nutri.agregar")}
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {notMine.map((item) => (
                    <Chip key={item.id} selected={false} onToggle={() => toggleMine(item.id)} icon={<Plus size={14} weight="bold" />}>
                      {item.name}
                    </Chip>
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>

        <section aria-labelledby="sugeridos" className="flex flex-col gap-3">
          <h2 id="sugeridos" className="text-h2 font-bold">
            {t(language, "nutri.sugeridos")}
          </h2>
          {advice ? (
            <ul className="flex flex-col gap-3">
              {advice.items.map((item) => {
                const SafetyIcon = SAFETY_ICON[item.safety];
                const meta = byId.get(item.supplement_id);
                const added = (profile?.current_supplements ?? []).includes(item.supplement_id);
                return (
                  <li key={item.supplement_id}>
                    <Card padding="sm" className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-h3 font-bold">{localized(item.name, language)}</h3>
                        <Badge tone={SAFETY_TONE[item.safety]} icon={<SafetyIcon size={14} weight="bold" />}>
                          {t(language, `seguridad.${item.safety}`)}
                        </Badge>
                      </div>
                      <p className="text-body">{localized(item.reason, language)}</p>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-small">
                        <dt className="font-extrabold">{t(language, "nutri.dosis")}</dt>
                        <dd className="font-bold">{localized(item.dosage, language)}</dd>
                        {meta?.brand_examples.length ? (
                          <>
                            <dt className="font-extrabold">{t(language, "nutri.marcas")}</dt>
                            <dd className="font-bold">{meta.brand_examples.join(", ")}</dd>
                          </>
                        ) : null}
                        <dt className="font-extrabold">kcal</dt>
                        <dd className="font-bold tabular-nums">
                          {item.macros.kcal} · {item.macros.protein_g} P / {item.macros.carbs_g} C / {item.macros.fat_g} G
                        </dd>
                      </dl>
                      {added ? (
                        <Badge tone="exito" icon={<Check size={14} weight="bold" />} className="self-start">
                          {t(language, "nutri.agregado")}
                        </Badge>
                      ) : (
                        <Button variant="suave" size="sm" icon={<Plus size={16} weight="bold" />} className="self-start" onClick={() => toggleMine(item.supplement_id)} disabled={item.safety === "AVOID"}>
                          {t(language, "nutri.agregarA")}
                        </Button>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            !failed && (
              <SkeletonGroup label={t(language, "nutri.cargando")}>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </SkeletonGroup>
            )
          )}
          <p className="flex items-start gap-2 text-small font-bold text-ink-suave">
            <Info size={18} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
            {t(language, "nutri.aviso")}
          </p>
        </section>
      </div>
    </div>
  );
}
