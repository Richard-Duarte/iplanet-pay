import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Pill } from "./pill";

interface ProductHeroCardProps {
  title: string;
  subtitle?: string;
  priceLabel?: string;
  badge?: string;
  imageSlot?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ProductHeroCard({
  title,
  subtitle,
  priceLabel,
  badge,
  imageSlot,
  footer,
  className,
}: ProductHeroCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white soft-glow",
        className,
      )}
    >
      <div className="glow-lavender absolute inset-0 pointer-events-none" />
      <div className="relative p-6 md:p-8">
        {badge ? (
          <Pill tone="accent" className="mb-4">
            {badge}
          </Pill>
        ) : null}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-2 text-[var(--ink-muted)]">{subtitle}</p>
            ) : null}
            {priceLabel ? (
              <p className="mt-4 text-xl font-semibold text-[var(--accent)]">
                {priceLabel}
              </p>
            ) : null}
          </div>
          <div className="relative flex h-44 w-44 items-center justify-center md:h-56 md:w-56">
            {imageSlot ?? (
              <div className="flex h-40 w-28 items-end justify-center rounded-[28px] bg-gradient-to-b from-[#1c1c1e] to-[#2c2c2e] shadow-[0_30px_60px_rgba(17,17,17,0.18)]">
                <div className="mb-3 h-1.5 w-16 rounded-full bg-white/20" />
              </div>
            )}
          </div>
        </div>
        {footer ? <div className="relative mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
