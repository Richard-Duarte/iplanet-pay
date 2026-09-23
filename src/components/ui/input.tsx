import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-2 text-sm">
      {label ? (
        <span className="font-medium text-[var(--ink)]">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:ring-4 focus:ring-black/5",
          error && "border-[var(--danger)]",
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="text-xs text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-xs text-[var(--ink-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
