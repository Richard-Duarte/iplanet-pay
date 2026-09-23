import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className, ...props }: TextareaProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm">
      {label ? (
        <span className="font-medium text-[var(--ink)]">{label}</span>
      ) : null}
      <textarea
        className={cn(
          "min-h-28 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:ring-4 focus:ring-black/5",
          className,
        )}
        {...props}
      />
      {hint ? (
        <span className="text-xs text-[var(--ink-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
