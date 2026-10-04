"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Choice } from "@/components/ui/Choice";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { getCatalog, updateMyProfile, type CatalogItem, type ExerciseLoad } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const LB_PER_KG = 2.20462;

/**
 * Usual loads (weight for 10 reps) per exercise. Stored in kg; shown in the
 * athlete's unit and converted when it is lb.
 */
export function CargasCard() {
  const { profile, language, setProfile } = useSession();
  const toast = useToast();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [unit, setUnit] = useState<"KG" | "LB">("KG");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [onlyFilled, setOnlyFilled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCatalog(language).then(setCatalog).catch(() => setCatalog([]));
  }, [language]);

  useEffect(() => {
    const u = profile?.weight_unit === "LB" ? "LB" : "KG";
    setUnit(u);
    const toUnit = (kg: number) => (u === "LB" ? Math.round(kg * LB_PER_KG * 10) / 10 : kg);
    setDraft(Object.fromEntries((profile?.loads ?? []).map((l) => [l.exercise_id, String(toUnit(l.weight_kg))])));
    setOnlyFilled((profile?.loads ?? []).length > 0);
  }, [profile]);

  const changeUnit = (next: "KG" | "LB") => {
    if (next === unit) return;
    const factor = next === "LB" ? LB_PER_KG : 1 / LB_PER_KG;
    setDraft((d) => Object.fromEntries(Object.entries(d).map(([id, v]) => [id, v === "" ? "" : String(Math.round(Number(v) * factor * 10) / 10)])));
    setUnit(next);
  };

  const list = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return catalog.filter((c) => (q ? c.name.toLocaleLowerCase().includes(q) : !onlyFilled || draft[c.id]));
  }, [catalog, query, onlyFilled, draft]);

  const save = async () => {
    const loads: ExerciseLoad[] = Object.entries(draft)
      .filter(([, v]) => Number(v) > 0)
      .map(([exercise_id, v]) => ({ exercise_id, weight_kg: Math.round((unit === "LB" ? Number(v) / LB_PER_KG : Number(v)) * 10) / 10, reps: 10 }));
    setSaving(true);
    try {
      setProfile(await updateMyProfile({ loads, weight_unit: unit }));
      toast({ tone: "exito", title: t(language, "perfil.guardado"), closeLabel: t(language, "comun.cerrar") });
    } catch {
      toast({ tone: "error", title: t(language, "nutri.errorGuardar"), closeLabel: t(language, "comun.cerrar") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold">{t(language, "perfil.cargas")}</h2>
          <p className="max-w-md text-small font-bold text-ink-suave">{t(language, "perfil.cargas.desc")}</p>
        </div>
        <Choice legend={t(language, "perfil.cargas.unidad")} hideLegend variant="segmentado" value={unit} onChange={changeUnit} options={[{ value: "KG", label: "kg" }, { value: "LB", label: "lb" }]} />
      </div>
      <div className="relative">
        <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-suave" />
        <Input type="search" aria-label={t(language, "perfil.cargas.buscar")} placeholder={t(language, "perfil.cargas.buscar")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12" />
      </div>
      {!query && (
        <label className="flex min-h-11 items-center gap-3 text-small font-extrabold">
          <input type="checkbox" checked={onlyFilled} onChange={(e) => setOnlyFilled(e.target.checked)} className="size-5 accent-ink" />
          {t(language, "perfil.cargas.solo")}
        </label>
      )}
      <ul className="grid max-h-96 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {list.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-ficha bg-rosa-claro py-1.5 pr-1.5 pl-4">
            <label htmlFor={`carga-${c.id}`} className="font-display text-body font-semibold">{c.name}</label>
            <div className="flex items-center gap-1">
              <Input id={`carga-${c.id}`} type="number" inputMode="decimal" min={0} step={0.5} value={draft[c.id] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.value }))} className="min-h-11 w-24 text-center tabular-nums" />
              <span aria-hidden="true" className="w-6 text-small font-extrabold">{unit.toLowerCase()}</span>
            </div>
          </li>
        ))}
      </ul>
      <Button onClick={() => void save()} loading={saving} loadingLabel={t(language, "onb.guardando")} className="self-start">
        {t(language, "perfil.cargas.guardar")}
      </Button>
    </Card>
  );
}
