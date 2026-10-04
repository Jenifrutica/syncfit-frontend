"use client";

import { useState } from "react";
import { ArrowsClockwise, Barbell, Info, LockSimple, PencilSimple } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Badge } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ExerciseThumb } from "@/components/rutina/ExerciseThumb";
import { localized, t, tf, type Language } from "@/lib/i18n";
import { editDose, type RoutineItem } from "@/lib/routine";

/** One exercise "cloud": dose, gym machine, block reason, and Change / Details / Edit. */
export function ExerciseCard({
  item,
  number,
  language,
  onChange,
  onDetails,
  onUpdate,
}: {
  item: RoutineItem;
  number: number;
  language: Language;
  onChange: () => void;
  onDetails: () => void;
  onUpdate: (item: RoutineItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const dose = tf(language, "rutina.dosis", { series: item.series, reps: item.reps });
  const weight = item.weightKg > 0 ? tf(language, "rutina.kg", { n: item.weightKg }) : t(language, "rutina.pesoLibre");

  const field = (label: string, value: number, key: "series" | "reps" | "weightKg", max: number) => (
    <label className="flex flex-col gap-1 text-small font-extrabold">
      {label}
      <Input
        type="number"
        inputMode={key === "weightKg" ? "decimal" : "numeric"}
        min={0}
        max={max}
        step={key === "weightKg" ? 0.5 : 1}
        value={value}
        onChange={(e) => {
          const n = Math.min(max, Math.max(0, Number(e.target.value) || 0));
          onUpdate(editDose(item, { [key]: n }));
        }}
        className="text-center tabular-nums"
      />
    </label>
  );

  return (
    <article className="overflow-hidden rounded-nube bg-nube shadow-nube">
      {item.blocked && (
        <div className="flex items-start gap-3 bg-peligro-suave px-4 py-3 text-peligro">
          <LockSimple size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
          <p className="text-small font-bold">
            <span className="font-extrabold">{t(language, "rutina.bloqueado")}:</span> {item.blockReason}
            {item.substitute && (
              <>
                <br />
                {t(language, "rutina.lo_cambiamos")}: <span className="font-extrabold">{item.substitute}</span>
              </>
            )}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ExerciseThumb name={item.name} imageUrl={item.imageUrl} mediaUrl={item.mediaUrl} />
            <span aria-hidden="true" className="absolute -top-1.5 -left-1.5 grid size-7 place-items-center rounded-full bg-ink font-display text-small font-bold text-nube">
              {number}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cx("text-h3 font-bold", item.blocked && "text-ink-suave line-through")}>{item.name}</h3>
            <p className="font-display text-body-lg font-semibold tabular-nums">
              {dose} · <span className={item.weightKg > 0 ? undefined : "text-ink-suave"}>{weight}</span>
            </p>
          </div>
        </div>
        {(item.machineName || item.edited) && (
          <div className="flex flex-wrap gap-2">
            {item.machineName && (
              <Badge tone="lavanda" icon={<Barbell size={14} weight="bold" />}>
                {localized(item.machineName, language)}
              </Badge>
            )}
            {item.edited && <Badge tone="fase">{t(language, "rutina.editada")}</Badge>}
          </div>
        )}

        {editing && (
          <div className="grid grid-cols-3 gap-2 rounded-ficha bg-rosa-claro p-3">
            {field(t(language, "rutina.series"), item.series, "series", 10)}
            {field(t(language, "rutina.reps"), item.reps, "reps", 50)}
            {field(t(language, "rutina.peso"), item.weightKg, "weightKg", 300)}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="suave" size="sm" icon={<ArrowsClockwise size={18} weight="bold" />} onClick={onChange}>
            {t(language, "rutina.cambiar")}
          </Button>
          <Button variant="suave" size="sm" icon={<Info size={18} weight="bold" />} onClick={onDetails}>
            {t(language, "rutina.detalles")}
          </Button>
          <Button variant={editing ? "primario" : "suave"} size="sm" icon={<PencilSimple size={18} weight="bold" />} aria-expanded={editing} onClick={() => setEditing((e) => !e)}>
            {editing ? t(language, "rutina.listo") : t(language, "rutina.editar")}
          </Button>
        </div>
      </div>
    </article>
  );
}
