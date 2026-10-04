"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";

export type ToastTone = "exito" | "error" | "info";

type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Localized name for the dismiss button. */
  closeLabel?: string;
};

type ShowToast = (toast: Omit<ToastItem, "id">) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

/** Shows a short message: what happened, and for errors how to recover. */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

const TONES: Record<ToastTone, { box: string; Icon: typeof Info }> = {
  exito: { box: "bg-exito-suave text-exito", Icon: CheckCircle },
  error: { box: "bg-peligro-suave text-peligro", Icon: WarningCircle },
  info: { box: "bg-ink text-nube sobre-oscuro", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (toast) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.tone === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map(({ id, tone, title, description, closeLabel = "OK" }) => {
          const { box, Icon } = TONES[tone];
          return (
            <div
              key={id}
              role={tone === "error" ? "alert" : "status"}
              className={cx(
                "pointer-events-auto flex w-full max-w-md animate-aparecer items-start gap-3 rounded-ficha px-4 py-3 shadow-nube",
                box,
              )}
            >
              <Icon size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-display text-body font-semibold">{title}</p>
                {description && <p className="text-small font-bold">{description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label={closeLabel}
                className="-m-2 grid size-11 shrink-0 place-items-center rounded-full"
              >
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
