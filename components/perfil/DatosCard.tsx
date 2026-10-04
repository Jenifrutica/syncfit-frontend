"use client";

import { useEffect, useState } from "react";
import { Camera } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { fileToDataUrl, getStats, updateMyProfile } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const FIELDS = [
  { key: "height_cm", label: "onb.altura", min: 120, max: 220, step: 1 },
  { key: "weight_kg", label: "onb.peso", min: 30, max: 250, step: 0.5 },
  { key: "body_fat_pct", label: "onb.grasa", min: 5, max: 60, step: 0.5 },
  { key: "daily_calories", label: "onb.calorias", min: 800, max: 6000, step: 10 },
  { key: "weekly_training_goal", label: "perfil.metaSemanal", min: 1, max: 7, step: 1 },
  { key: "rest_days_allowance", label: "perfil.descansos", min: 0, max: 7, step: 1 },
] as const;

type Key = (typeof FIELDS)[number]["key"];

/** Photo (compressed before upload), name and the body/goal numbers. Only changed fields are sent. */
export function DatosCard() {
  const { user, profile, language, setProfile } = useSession();
  const toast = useToast();
  const [values, setValues] = useState<Record<Key, string>>({} as Record<Key, string>);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // GET /profiles/me does not return the weekly goal / rest days yet; /stats does.
  const [fallback, setFallback] = useState<Partial<Record<Key, number>>>({});

  useEffect(() => {
    getStats()
      .then((s) => setFallback({ weekly_training_goal: s.weekly_goal, rest_days_allowance: s.rest_days_allowance }))
      .catch(() => setFallback({}));
  }, [profile]);

  const current = (key: Key): number | undefined => profile?.[key] ?? fallback[key];

  useEffect(() => {
    if (!profile) return;
    setValues(Object.fromEntries(FIELDS.map((f) => [f.key, current(f.key) != null ? String(current(f.key)) : ""])) as Record<Key, string>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, fallback]);

  const say = (title: string, tone: "exito" | "error" = "exito") => toast({ tone, title, closeLabel: t(language, "comun.cerrar") });

  const save = async () => {
    const patch: Record<string, number> = {};
    for (const f of FIELDS) {
      const raw = values[f.key];
      const original = current(f.key);
      if (raw === "" || Number(raw) === original) continue;
      patch[f.key] = Math.min(f.max, Math.max(f.min, Number(raw)));
    }
    if (Object.keys(patch).length === 0) return say(t(language, "perfil.sinCambios"));
    setSaving(true);
    try {
      setProfile(await updateMyProfile(patch));
      say(t(language, "perfil.guardado"));
    } catch {
      say(t(language, "nutri.errorGuardar"), "error");
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      setProfile(await updateMyProfile({ photo_url: await fileToDataUrl(file, 512) }));
      say(t(language, "perfil.fotoGuardada"));
    } catch {
      say(t(language, "nutri.errorGuardar"), "error");
    } finally {
      setUploading(false);
    }
  };

  const initial = (user?.display_name ?? "?").charAt(0).toUpperCase();

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          {profile?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt="" width={80} height={80} className="size-20 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-fase-suave font-display text-h1 font-bold">{initial}</span>
          )}
          <label className="absolute -right-1 -bottom-1 grid size-10 cursor-pointer place-items-center rounded-full bg-ink text-nube shadow-boton has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
            <Camera size={18} weight="bold" aria-hidden="true" />
            <span className="sr-only">{t(language, "perfil.foto")}</span>
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => void onPhoto(e.target.files?.[0])} />
          </label>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-h2 font-bold">{user?.display_name}</h2>
          <p className="truncate text-small font-bold text-ink-suave">{user?.email}</p>
          {profile?.modality && <Badge tone="fase" className="self-start">{t(language, `perfil.modalidad.${profile.modality}`)}</Badge>}
        </div>
      </div>

      <section aria-labelledby="mis-datos" className="flex flex-col gap-4">
        <h3 id="mis-datos" className="text-h3 font-bold">{t(language, "perfil.datos")}</h3>
        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <Field key={f.key} label={t(language, f.label)}>
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="tabular-nums"
                />
              )}
            </Field>
          ))}
        </div>
        <Button onClick={() => void save()} loading={saving} loadingLabel={t(language, "onb.guardando")} className="self-start">
          {t(language, "perfil.guardar")}
        </Button>
      </section>
    </Card>
  );
}
