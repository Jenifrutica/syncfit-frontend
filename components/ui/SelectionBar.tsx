"use client";

import { useState, type ReactNode } from "react";
import { ArrowCounterClockwise, Trash } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { t, tf, type Language } from "@/lib/i18n";
import type { Selection } from "@/lib/useSelection";

/** Checkbox for one row; pairs with SelectionBar. */
export function RowCheck({ selection, id, label }: { selection: Selection; id: string; label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={selection.has(id)}
      onChange={() => selection.toggle(id)}
      className="size-5 shrink-0 accent-ink"
      data-row-check={id}
    />
  );
}

/**
 * "Select all / deselect all" for the visible rows, a counter and the bulk
 * delete (always a DELETE request, confirmed first). `onReactivate` adds a
 * second action for soft-deleted catalogs.
 */
export function SelectionBar({
  selection,
  total,
  language,
  onDelete,
  onReactivate,
  deleteLabel,
  extra,
  confirmDescription,
  requirePassword,
}: {
  selection: Selection;
  total: number;
  language: Language;
  /** Receives the typed password when `requirePassword` is set. */
  onDelete: (ids: string[], password?: string) => Promise<void>;
  onReactivate?: (ids: string[]) => Promise<void>;
  deleteLabel?: string;
  extra?: ReactNode;
  confirmDescription?: string;
  /** Ask for the user's own password before deleting (super admin accounts). */
  requirePassword?: { label: string; hint?: string };
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  if (total === 0) return null;

  const run = async (action: (ids: string[], password?: string) => Promise<void>) => {
    setBusy(true);
    try {
      await action(selection.ids, requirePassword ? password : undefined);
      selection.clear();
    } finally {
      setBusy(false);
      setConfirming(false);
      setPassword("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-nube px-3 py-2" role="toolbar" aria-label={t(language, "sel.todos")}>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-small font-extrabold">
        <input
          type="checkbox"
          checked={selection.allSelected}
          ref={(el) => {
            if (el) el.indeterminate = selection.count > 0 && !selection.allSelected;
          }}
          onChange={selection.toggleAll}
          className="size-5 accent-ink"
          data-select-all
        />
        {selection.allSelected ? t(language, "sel.ninguno") : t(language, "sel.todos")}
      </label>
      <span className="text-small font-bold text-ink-suave" aria-live="polite">
        {tf(language, "sel.contador", { n: selection.count })}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        {extra}
        {onReactivate && (
          <Button variant="suave" size="sm" icon={<ArrowCounterClockwise size={16} weight="bold" />} disabled={selection.count === 0 || busy} onClick={() => void run(onReactivate)}>
            {t(language, "sel.reactivar")}
          </Button>
        )}
        <Button variant="peligro" size="sm" icon={<Trash size={16} weight="bold" />} disabled={selection.count === 0 || busy} onClick={() => setConfirming(true)} data-bulk-delete>
          {deleteLabel ?? t(language, "sel.eliminar")}
        </Button>
      </div>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={tf(language, "sel.confirmar", { n: selection.count })}
        description={confirmDescription ?? t(language, "sel.confirmarDesc")}
        closeLabel={t(language, "comun.cerrar")}
        footer={
          <>
            <Button variant="peligro" loading={busy} disabled={!!requirePassword && !password} onClick={() => void run(onDelete)} data-bulk-confirm>
              {deleteLabel ?? t(language, "sel.eliminar")}
            </Button>
            <Button variant="suave" onClick={() => setConfirming(false)}>{t(language, "cuenta.cancelar")}</Button>
          </>
        }
      >
        {requirePassword ? (
          <Field label={requirePassword.label} hint={requirePassword.hint}>
            {(control) => (
              <PasswordInput
                {...control}
                showLabel={t(language, "entrar.clave.mostrar")}
                hideLabel={t(language, "entrar.clave.ocultar")}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
        ) : null}
      </Dialog>
    </div>
  );
}
