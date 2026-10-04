"use client";

import { useEffect, useState } from "react";
import { Heartbeat, Info } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Choice } from "@/components/ui/Choice";
import { Pulsi } from "@/components/mascot/Pulsi";
import { SpeechBubble } from "@/components/mascot/SpeechBubble";
import { FeelingSheet } from "@/components/hoy/FeelingSheet";
import { GENERAL_GROUPS, ISOLATED_GROUPS, getSymptoms, type EnergyLevel, type SymptomInfo } from "@/lib/api";
import { readEnergy, saveEnergy } from "@/lib/energia";
import { muscleLabel, t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export type CaptureOptions = {
  groups: string[];
  exercises: number;
  minutes: number | null;
  energy: EnergyLevel;
  warmup: boolean;
};

const CONFIG_KEY = "syncfit-rutina-config";
const MAX_GROUPS = 4;
const TIMES = ["0", "30", "45", "60", "90"] as const;

function lastConfig(): Partial<CaptureOptions> {
  try {
    return JSON.parse(window.localStorage.getItem(CONFIG_KEY) ?? "{}") as Partial<CaptureOptions>;
  } catch {
    return {};
  }
}

/** Choose what to train, then scan. Remembers the last choices on this device. */
export function RoutineConfig({ today, onScan }: { today: string; onScan: (options: CaptureOptions) => void }) {
  const { profile, language } = useSession();
  const [groups, setGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState("5");
  const [minutes, setMinutes] = useState<string>("0");
  const [energy, setEnergy] = useState<EnergyLevel>("MODERATE");
  const [warmup, setWarmup] = useState(true);
  const [symptoms, setSymptoms] = useState<SymptomInfo[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const last = lastConfig();
    if (last.groups?.length) setGroups(last.groups.slice(0, MAX_GROUPS));
    if (last.exercises) setExercises(String(last.exercises));
    if (last.minutes !== undefined) setMinutes(String(last.minutes ?? 0));
    if (last.warmup !== undefined) setWarmup(last.warmup);
    setEnergy(readEnergy(today) ?? "MODERATE");
  }, [today]);

  useEffect(() => {
    getSymptoms(language).then(setSymptoms).catch(() => setSymptoms([]));
  }, [language]);

  const toggleGroup = (group: string) => {
    setError(null);
    setGroups((current) => (current.includes(group) ? current.filter((g) => g !== group) : current.length < MAX_GROUPS ? [...current, group] : current));
  };

  const chooseEnergy = (value: EnergyLevel) => {
    setEnergy(value);
    saveEnergy(today, value);
  };

  const scan = () => {
    if (groups.length === 0) {
      setError(t(language, "rutina.config.elige"));
      document.getElementById("grupos")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const options: CaptureOptions = { groups, exercises: Number(exercises), minutes: minutes === "0" ? null : Number(minutes), energy, warmup };
    try {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(options));
    } catch {
      // Not remembered next time; fine.
    }
    onScan(options);
  };

  const mySymptoms = symptoms.filter((s) => profile?.symptoms?.includes(s.id));
  const pain = profile?.pain_levels?.OVERALL ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-2">
        <Pulsi mood="feliz" size={80} animated />
        <SpeechBubble tone="nube" className="mb-8">
          {t(language, "rutina.config.burbuja")}
        </SpeechBubble>
      </div>
      <h1 className="text-h1 font-bold">{t(language, "rutina.titulo")}</h1>

      <Card id="grupos" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h3 font-bold">{t(language, "rutina.config.grupos")}</h2>
          <span aria-live="polite" className="text-small font-extrabold text-ink-suave tabular-nums">
            {tf(language, "rutina.config.contador", { n: groups.length })}
          </span>
        </div>
        {[
          { legend: "rutina.config.musculos", list: ISOLATED_GROUPS },
          { legend: "rutina.config.zonas", list: GENERAL_GROUPS },
        ].map(({ legend, list }) => (
          <fieldset key={legend} className="flex flex-col gap-2">
            <legend className="mb-2 text-small font-extrabold">{t(language, legend)}</legend>
            <div className="flex flex-wrap gap-2">
              {list.map((group) => (
                <Chip
                  key={group}
                  selected={groups.includes(group)}
                  onToggle={() => toggleGroup(group)}
                  disabled={!groups.includes(group) && groups.length >= MAX_GROUPS}
                >
                  {muscleLabel(language, group)}
                </Chip>
              ))}
            </div>
          </fieldset>
        ))}
        {error && (
          <p role="alert" className="text-small font-bold text-peligro">
            {error}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-5">
        <Choice
          legend={t(language, "rutina.config.ejercicios")}
          variant="pildoras"
          columns={3}
          value={exercises}
          onChange={setExercises}
          options={["3", "4", "5", "6", "7", "8"].map((n) => ({ value: n, label: n }))}
        />
        <Choice
          legend={t(language, "rutina.config.tiempo")}
          variant="pildoras"
          columns={3}
          value={minutes}
          onChange={setMinutes}
          options={TIMES.map((n) => ({ value: n, label: n === "0" ? t(language, "rutina.config.sinLimite") : tf(language, "rutina.config.min", { n }) }))}
        />
        <Choice
          legend={t(language, "rutina.config.energia")}
          variant="pildoras"
          columns={3}
          value={energy}
          onChange={chooseEnergy}
          options={(["ENERGY", "MODERATE", "NO_ENERGY"] as EnergyLevel[]).map((e) => ({ value: e, label: <span className="text-body">{t(language, `energia.${e}`)}</span> }))}
        />
        <label className="flex min-h-12 items-center justify-between gap-3 font-display text-body-lg font-semibold">
          {t(language, "rutina.config.calentamiento")}
          <input type="checkbox" role="switch" checked={warmup} onChange={(e) => setWarmup(e.target.checked)} className="size-6 accent-ink" />
        </label>
      </Card>

      <Card tone="rosa-claro" className="flex items-start gap-3">
        <Info size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-display text-body-lg font-semibold">{t(language, "rutina.config.sintomas")}</p>
          <p className="text-small font-bold text-ink-suave">
            {mySymptoms.length ? mySymptoms.map((s) => s.name).join(" · ") : t(language, "rutina.config.sinSintomas")}
            {pain > 0 ? ` · ${t(language, "sentir.dolor")} ${pain}/10` : ""}
          </p>
        </div>
        <Button variant="secundario" size="sm" onClick={() => setSheetOpen(true)}>
          {t(language, "rutina.config.cambiar")}
        </Button>
      </Card>

      <Button size="lg" fullWidth icon={<Heartbeat size={22} weight="bold" />} onClick={scan} className="sticky bottom-24 lg:bottom-6">
        {t(language, "hoy.escanear")}
      </Button>

      <FeelingSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEnergy((current) => readEnergy(today) ?? current);
        }}
        symptoms={symptoms}
        today={today}
      />
    </div>
  );
}
