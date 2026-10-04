import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/cx";
import { Spinner } from "@/components/ui/Spinner";

export type ButtonVariant = "primario" | "secundario" | "suave" | "peligro" | "fantasma";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primario: "bg-ink text-nube shadow-boton hover:bg-ink-claro active:bg-ink-hondo",
  secundario: "bg-nube text-ink hover:bg-rosa-claro",
  suave: "bg-rosa-claro text-ink hover:bg-lutea-suave",
  peligro: "bg-peligro-suave text-peligro hover:bg-menstrual-suave",
  fantasma: "bg-transparent text-ink hover:bg-nube/70",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-small",
  md: "min-h-12 px-6 text-button",
  lg: "min-h-14 px-8 text-body-lg",
};

/** Shared classes so links that look like buttons stay identical. */
export function buttonClasses(variant: ButtonVariant = "primario", size: ButtonSize = "md", fullWidth = false) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold select-none",
    "transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
  );
}

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
};

export type ButtonProps = Common &
  ComponentProps<"button"> & {
    /** Shows a spinner and swaps the label while an async action runs. */
    loading?: boolean;
    loadingLabel?: string;
  };

export function Button({
  variant,
  size,
  fullWidth,
  icon,
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClasses(variant, size, fullWidth), className)}
      {...rest}
    >
      {loading ? <Spinner size={18} /> : icon}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

export type ButtonLinkProps = Common & ComponentProps<typeof Link>;

export function ButtonLink({ variant, size, fullWidth, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={cx(buttonClasses(variant, size, fullWidth), "no-underline", className)} {...rest}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export type IconButtonProps = Omit<ComponentProps<"button">, "aria-label"> & {
  /** Required: icon-only controls must be named. */
  label: string;
  variant?: Exclude<ButtonVariant, "primario"> | "primario";
  size?: "md" | "lg";
};

export function IconButton({ label, variant = "secundario", size = "md", className, children, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full",
        "transition-transform duration-[var(--dur-toque)] ease-[var(--ease-salida)] active:scale-[0.94]",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        size === "md" ? "size-11" : "size-14",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
