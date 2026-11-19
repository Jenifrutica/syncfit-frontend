"use client";

import { CheckSquare, XSquare } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cx";
import { t, tf, type Language } from "@/lib/i18n";
import { fillUpTo } from "@/lib/seleccion";

export type SeleccionMasivaProps = {
  /** Every option shown, in order. */
  values: readonly string[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  language: Language;
  /** Most options that can be chosen at once ("Choose up to N"). */
  max?: number;
  /** Rejects an option given the current choice (e.g. incompatible groups). */
  canAdd?: (value: string, current: readonly string[]) => boolean;
  className?: string;
};

/**
 * Two buttons above a multi-select list: select all (or "choose up to N" when
 * there is a limit) and clear. Works with any list of string ids.
 */
export function SeleccionMasiva({ values, selected, onChange, language, max, canAdd, className }: SeleccionMasivaProps) {
  const filled = fillUpTo(values, selected, max, canAdd);
  const limited = max !== undefined && max < values.length;
  return (
    <div className={cx("flex flex-wrap items-center gap-2", className)} data-seleccion-masiva>
      <Button variant="suave" size="sm" icon={<CheckSquare size={16} weight="bold" />} disabled={filled.length === selected.length} onClick={() => onChange(filled)} data-seleccionar-todo>
        {limited ? tf(language, "sel.hasta", { n: max }) : t(language, "sel.todos")}
      </Button>
      <Button variant="fantasma" size="sm" icon={<XSquare size={16} weight="bold" />} disabled={selected.length === 0} onClick={() => onChange([])} data-quitar-todo>
        {t(language, "sel.ninguno")}
      </Button>
    </div>
  );
}
