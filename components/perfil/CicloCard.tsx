"use client";

import { useEffect, useState } from "react";
import { Drop } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { useToast } from "@/components/ui/Toast";
import { MonthPicker } from "@/components/cycle/MonthPicker";
import { updateMyProfile } from "@/lib/api";
import { fromISODate, todayISO } from "@/lib/dates";
import { t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const LOCALE = { ES: "es", EN: "en", ZH: "zh-CN" } as const;

/** Flo's "log period": new last-period date and cycle length (or pregnancy week). */
export function CicloCard() {
  const { profile, language, setProfile } = useSession();
  const toast = useToast();
  const pregnant = profile?.modality === "GESTATIONAL";
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [length, setLength] = useState(28);
  const [week, setWeek] = useState(12);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLength(profile?.cycle_length_days ?? 28);
    setWeek(profile?.gestation_week ?? profile?.timeline?.week ?? 12);
  }, [profile]);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      setProfile(await updateMyProfile(patch));
      toast({ tone: "exito", title: t(language, "perfil.ciclo.registrado"), closeLabel: t(language, "comun.cerrar") });
      setOpen(false);
    } catch {
      toast({ tone: "error", title: t(language, "nutri.errorGuardar"), closeLabel: t(language, "comun.cerrar") });
    } finally {
      setSaving(false);
    }
  };

  const last = profile?.last_period_date
    ? new Intl.DateTimeFormat(LOCALE[language], { day: "numeric", month: "long" }).format(fromISODate(profile.last_period_date))
    : null;

  if (pregnant) {
    return (
      <Card tone="fase-suave" className="flex flex-col gap-4">
        <h2 className="text-h3 font-bold">{t(language, "perfil.embarazo")}</h2>
        <NumberStepper id="perfil-semana" label={t(language, "perfil.embarazo.semana")} value={week} onChange={setWeek} min={1} max={42} unit={t(language, "onb.semana.unidad")} decreaseLabel={t(language, "comun.menos")} increaseLabel={t(language, "comun.mas")} />
        <Button onClick={() => void save({ gestation_week: week })} loading={saving} disabled={week === (profile?.gestation_week ?? profile?.timeline?.week)} className="self-start">
          {t(language, "perfil.guardar")}
        </Button>
      </Card>
    );
  }

  return (
    <Card tone="fase-suave" className="flex flex-col gap-4">
      <h2 className="text-h3 font-bold">{t(language, "perfil.ciclo")}</h2>
      <p className="text-body font-bold">{last ? tf(language, "perfil.ciclo.ultimo", { fecha: last }) : t(language, "perfil.ciclo.sinFecha")}</p>
      <Button icon={<Drop size={18} weight="bold" />} onClick={() => { setDate(null); setOpen(true); }} className="self-start">
        {t(language, "perfil.ciclo.registrar")}
      </Button>
      <div className="flex flex-col gap-2">
        <p className="text-small font-extrabold">{t(language, "perfil.ciclo.duracion")}</p>
        <NumberStepper id="perfil-duracion" label={t(language, "perfil.ciclo.duracion")} value={length} onChange={setLength} min={21} max={45} unit={t(language, "onb.duracion.unidad")} decreaseLabel={t(language, "comun.menos")} increaseLabel={t(language, "comun.mas")} />
        {length !== (profile?.cycle_length_days ?? 28) && (
          <Button variant="secundario" onClick={() => void save({ cycle_length_days: length })} loading={saving} className="self-start">
            {t(language, "perfil.guardar")}
          </Button>
        )}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        variant="sheet"
        title={t(language, "onb.fum.titulo")}
        closeLabel={t(language, "comun.cerrar")}
        footer={
          <Button fullWidth size="lg" disabled={!date} loading={saving} onClick={() => date && void save({ last_period_date: date })}>
            {t(language, "perfil.guardar")}
          </Button>
        }
      >
        <MonthPicker value={date} onChange={setDate} max={todayISO()} language={language} highlightDays={5} labels={{ previous: t(language, "cal.anterior"), next: t(language, "cal.siguiente") }} />
      </Dialog>
    </Card>
  );
}
