"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { IconButton } from "@/components/ui/Button";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** "sheet" slides up from the bottom on phones (Flo-style quick logging); centered on larger screens. */
  variant?: "modal" | "sheet";
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Native <dialog> shown with showModal(): focus trap, Escape and focus
 * restore come from the browser. Clicking the backdrop closes it.
 */
export function Dialog({ open, onClose, title, description, variant = "modal", closeLabel, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the dialog itself so the first button does not show a ring after a mouse click;
      // Tab still moves straight into the content.
      dialog.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const sheet = variant === "sheet";

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cx(
        "m-auto bg-nube p-0 text-ink shadow-dialogo focus-visible:outline-none",
        "w-[min(100%-2rem,34rem)] max-h-[min(90svh,52rem)] rounded-nube",
        sheet
          ? "max-sm:mb-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none open:animate-subir sm:open:animate-aparecer"
          : "open:animate-aparecer",
      )}
    >
      <div className="flex flex-col gap-4 px-5 pt-3 pb-6 sm:px-7 sm:pt-6">
        {sheet && <div aria-hidden="true" className="mx-auto h-1.5 w-11 rounded-full bg-lutea-suave sm:hidden" />}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-h3 font-bold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-small font-bold text-ink-suave">
                {description}
              </p>
            )}
          </div>
          <IconButton label={closeLabel} variant="suave" onClick={onClose}>
            <X size={20} weight="bold" />
          </IconButton>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        {footer && <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse">{footer}</div>}
      </div>
    </dialog>
  );
}
