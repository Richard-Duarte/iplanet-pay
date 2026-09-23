import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--line)] bg-[var(--bg-subtle)] px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--accent)] soft-glow">
          {icon}
        </div>
      ) : null}
      <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-[var(--ink-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
