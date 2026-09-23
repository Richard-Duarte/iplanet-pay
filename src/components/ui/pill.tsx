import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "danger" | "lavender";

const tones: Record<Tone, string> = {
  neutral: "bg-[var(--bg-subtle)] text-[var(--ink-muted)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  success: "bg-green-50 text-[var(--success)]",
  danger: "bg-red-50 text-[var(--danger)]",
  lavender: "bg-[var(--bg-lavender)] text-[var(--ink)]",
};

export function Pill({
  className,
  tone = "neutral",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Badge(props: Parameters<typeof Pill>[0]) {
  return <Pill {...props} />;
}
