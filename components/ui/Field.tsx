"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
};

export type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  /** Shown below the control and announced; say what happened and how to fix it. */
  error?: string | null;
  required?: boolean;
  /** Localized "(required)" marker shown next to the label. */
  requiredText?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label above, control, then hint/error below — wired with ids so screen
 * readers announce them. Validate on blur, not on every keystroke.
 */
export function Field({ label, hint, error, required, requiredText, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-extrabold text-ink">
        {label}
        {required && requiredText && (
          <span className="font-bold text-ink-suave"> {requiredText}</span>
        )}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required })}
      {hint && !error && (
        <p id={hintId} className="text-small text-ink-suave">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-small font-bold text-peligro">
          <WarningCircle size={18} weight="bold" aria-hidden="true" className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const CONTROL =
  "w-full min-h-12 rounded-campo border-2 border-linea bg-nube px-4 text-body text-ink " +
  "focus-visible:border-ink aria-invalid:border-peligro disabled:opacity-60";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cx(CONTROL, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cx(CONTROL, "appearance-none bg-[length:20px] bg-[right_1rem_center] bg-no-repeat pr-11", className)} style={{ backgroundImage: SELECT_ARROW }} {...rest}>
      {children}
    </select>
  );
}

export function TextArea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cx(CONTROL, "py-3 leading-normal", className)} {...rest} />;
}

const SELECT_ARROW =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232a1d65' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";
