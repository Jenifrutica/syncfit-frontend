"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Input } from "@/components/ui/Field";

/** Password field with a show/hide toggle (labels are localized by the caller). */
export function PasswordInput({
  showLabel,
  hideLabel,
  className,
  ...rest
}: Omit<ComponentProps<"input">, "type"> & { showLabel: string; hideLabel: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cx("pr-14", className)} {...rest} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1 my-auto grid size-11 place-items-center rounded-full text-ink-suave hover:bg-rosa-claro"
      >
        {visible ? <EyeSlash size={20} weight="bold" aria-hidden="true" /> : <Eye size={20} weight="bold" aria-hidden="true" />}
      </button>
    </div>
  );
}
