import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-[var(--ink-muted)]">{label}</span>
          <span className="font-semibold text-[var(--ink)]">{clamped}%</span>
        </div>
      ) : null}
      <div className="h-3 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--bg-subtle)]">
        <div
          className="h-full rounded-[var(--radius-pill)] bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
