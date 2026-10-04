"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowsClockwise, Barbell, CheckCircle, MagnifyingGlass, Plus, SignOut, Trash } from "@phosphor-icons/react";

import { Badge, Chip } from "@/components/ui/Chip";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Choice } from "@/components/ui/Choice";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { EmptyState, Skeleton, SkeletonGroup } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { activateGym, getJoinedGyms, getMachines, getMyProfile, joinGym, leaveGym, updateMyProfile, type GymMachine, type JoinedGym } from "@/lib/api";
import { realImage } from "@/lib/routine";
import { localized, t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const REFRESH_MS = 15_000;

export function GimnasiosScreen() {
  const { profile, language, setProfile } = useSession();
  const toast = useToast();
  const [gyms, setGyms] = useState<JoinedGym[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [leaving, setLeaving] = useState<JoinedGym | null>(null);
  const [catalog, setCatalog] = useState<GymMachine[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    try {
      setGyms(await getJoinedGyms(language));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [language]);

  // Live machines: refresh on focus, when the tab becomes visible and every 15 s.
  useEffect(() => {
    void refresh();
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, [refresh]);

  useEffect(() => {
    getMachines(language).then(setCatalog).catch(() => setCatalog([]));
  }, [language]);

  const syncProfile = async () => setProfile(await getMyProfile().catch(() => profile));
  const notify = (title: string, tone: "exito" | "error" = "exito") => toast({ tone, title, closeLabel: t(language, "comun.cerrar") });

  const join = async (event: FormEvent) => {
    event.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setCodeError(t(language, "gym.codigoInvalido"));
      return;
    }
    setJoining(true);
    setCodeError(null);
    try {
      const gym = await joinGym(clean);
      setCode("");
      notify(tf(language, "gym.unido", { gym: gym.name }));
      await Promise.all([refresh(), syncProfile()]);
    } catch {
      setCodeError(t(language, "gym.codigoInvalido"));
    } finally {
      setJoining(false);
    }
  };

  const activate = async (gym: JoinedGym) => {
    try {
      await activateGym(gym.gym_id, language);
      notify(tf(language, "gym.activado", { gym: gym.name }));
      await Promise.all([refresh(), syncProfile()]);
    } catch {
      notify(t(language, "nutri.errorGuardar"), "error");
    }
  };

  const leave = async () => {
    if (!leaving) return;
    try {
      await leaveGym(leaving.gym_id);
      setLeaving(null);
      await Promise.all([refresh(), syncProfile()]);
    } catch {
      notify(t(language, "nutri.errorGuardar"), "error");
    }
  };

  const mine = new Set(profile?.available_machines ?? []);
  const toggleMachine = async (id: string) => {
    const next = new Set(mine);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    try {
      setProfile(await updateMyProfile({ available_machines: [...next] }));
    } catch {
      notify(t(language, "nutri.errorGuardar"), "error");
    }
  };

  const visible = filter === "ALL" ? (gyms ?? []) : (gyms ?? []).filter((g) => g.gym_id === filter);
  const myMachines = catalog.filter((m) => mine.has(m.id));
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q ? catalog.filter((m) => m.name.toLocaleLowerCase().includes(q)) : catalog;
  }, [catalog, query]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pt-6 sm:px-8 lg:pt-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold">{t(language, "gym.titulo")}</h1>
        <p className="text-body-lg font-bold text-ink-suave">{t(language, "gym.sub")}</p>
      </header>

      <Card tone="crema">
        <form onSubmit={join} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field id="codigo-gym" label={t(language, "gym.codigo")} hint={t(language, "gym.codigoAyuda")} error={codeError} className="flex-1">
            {(control) => (
              <Input {...control} value={code} autoCapitalize="characters" autoComplete="off" onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-display tracking-widest uppercase" />
            )}
          </Field>
          <Button type="submit" loading={joining} icon={<Plus size={18} weight="bold" />} className="sm:mb-7">
            {t(language, "gym.unirmeBoton")}
          </Button>
        </form>
      </Card>

      <section aria-labelledby="mis-gyms" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="mis-gyms" className="text-h2 font-bold">
            {t(language, "gym.mios")}
          </h2>
          <Button variant="suave" size="sm" icon={<ArrowsClockwise size={16} weight="bold" />} onClick={() => void refresh()}>
            {t(language, "gym.actualizar")}
          </Button>
        </div>

        {gyms && gyms.length > 1 && (
          <Choice
            legend={t(language, "gym.mios")}
            hideLegend
            variant="segmentado"
            value={filter}
            onChange={setFilter}
            options={[{ value: "ALL", label: t(language, "gym.todos") }, ...gyms.map((g) => ({ value: g.gym_id, label: g.name }))]}
          />
        )}

        {failed && !gyms ? (
          <Card className="flex flex-col items-start gap-3">
            <p role="alert" className="text-body font-bold">{t(language, "gym.error")}</p>
            <Button variant="suave" size="sm" onClick={() => void refresh()}>{t(language, "comun.reintentar")}</Button>
          </Card>
        ) : !gyms ? (
          <SkeletonGroup label={t(language, "app.cargando")}>
            <Skeleton className="h-40" />
          </SkeletonGroup>
        ) : gyms.length === 0 ? (
          <Card>
            <EmptyState mood="feliz" title={t(language, "gym.ninguno")} />
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {visible.map((gym) => (
              <li key={gym.gym_id}>
                <Card className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-h3 font-bold">{gym.name}</h3>
                      <p className="font-display text-small font-semibold tracking-widest text-ink-suave">#{gym.code}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gym.active ? (
                        <Badge tone="exito" icon={<CheckCircle size={14} weight="bold" />}>{t(language, "gym.activo")}</Badge>
                      ) : (
                        <Button size="sm" variant="suave" onClick={() => void activate(gym)}>{t(language, "gym.activar")}</Button>
                      )}
                      <IconButton label={t(language, "gym.salir")} variant="suave" onClick={() => setLeaving(gym)}>
                        <SignOut size={18} weight="bold" />
                      </IconButton>
                    </div>
                  </div>
                  {gym.machines.length === 0 ? (
                    <p className="text-body text-ink-suave">{t(language, "gym.sinMaquinas")}</p>
                  ) : (
                    <ul aria-label={tf(language, "gym.maquinasDe", { gym: gym.name })} className="grid gap-2 sm:grid-cols-2">
                      {gym.machines.map((m) => {
                        const image = realImage(m.image_url);
                        return (
                          <li key={m.id} className="flex items-center gap-3 rounded-ficha bg-rosa-claro p-2 pr-4">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={image} alt="" width={56} height={56} className="size-14 shrink-0 rounded-campo object-cover" />
                            ) : (
                              <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-campo bg-fase-suave"><Barbell size={24} weight="bold" /></span>
                            )}
                            <div className="min-w-0">
                              <p className="font-display text-body font-semibold">{localized(m.name, language) || m.name_text}</p>
                              <p className="text-caption font-extrabold text-ink-suave">
                                {[localized(m.purpose ?? undefined, language), tf(language, "gym.factor", { n: m.weight_factor })].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mis-maquinas" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="mis-maquinas" className="text-h2 font-bold">{t(language, "gym.misMaquinas")}</h2>
          <Button variant="suave" size="sm" icon={<Plus size={16} weight="bold" />} onClick={() => setPickerOpen(true)}>
            {t(language, "gym.misMaquinas.agregar")}
          </Button>
        </div>
        <p className="text-body text-ink-suave">{t(language, "gym.misMaquinas.desc")}</p>
        {myMachines.length === 0 ? (
          <p className="text-small font-bold text-ink-suave">{t(language, "gym.misMaquinas.ninguna")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {myMachines.map((m) => (
              <li key={m.id} className="flex items-center gap-1 rounded-full bg-nube py-1 pr-1 pl-4 font-display font-semibold">
                {m.name}
                <IconButton label={tf(language, "gym.quitar", { nombre: m.name })} variant="fantasma" className="size-9" onClick={() => void toggleMachine(m.id)}>
                  <Trash size={16} weight="bold" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} variant="sheet" title={t(language, "gym.misMaquinas")} closeLabel={t(language, "comun.cerrar")}>
        <div className="relative">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-suave" />
          <Input type="search" aria-label={t(language, "gym.misMaquinas.buscar")} placeholder={t(language, "gym.misMaquinas.buscar")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12" />
        </div>
        <div className="flex flex-wrap gap-2">
          {results.map((m) => (
            <Chip key={m.id} selected={mine.has(m.id)} onToggle={() => void toggleMachine(m.id)}>
              {m.name}
            </Chip>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={leaving !== null}
        onClose={() => setLeaving(null)}
        title={leaving ? tf(language, "gym.salirConfirma", { gym: leaving.name }) : ""}
        description={t(language, "gym.salirDesc")}
        closeLabel={t(language, "comun.cerrar")}
        footer={
          <>
            <Button variant="peligro" onClick={() => void leave()}>{t(language, "gym.salir")}</Button>
            <Button variant="suave" onClick={() => setLeaving(null)}>{t(language, "cuenta.cancelar")}</Button>
          </>
        }
      >
        {null}
      </Dialog>
    </div>
  );
}
