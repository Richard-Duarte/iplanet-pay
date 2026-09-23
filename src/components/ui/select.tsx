import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export function Select({ label, hint, className, children, ...props }: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm">
      {label ? (
        <span className="font-medium text-[var(--ink)]">{label}</span>
      ) : null}
      <select
        className={cn(
          "h-12 w-full appearance-none rounded-2xl border border-[var(--line)] bg-white px-4 text-[var(--ink)] outline-none transition focus:border-[var(--ink)] focus:ring-4 focus:ring-black/5",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <span className="text-xs text-[var(--ink-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
