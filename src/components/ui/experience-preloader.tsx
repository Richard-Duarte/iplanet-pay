"use client";

import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn("experience-skeleton overflow-hidden rounded-full", className)}
      aria-hidden
    />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("experience-skeleton overflow-hidden rounded-2xl", className)}
      aria-hidden
    />
  );
}

function ClientePageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-6 md:px-8">
      <div className="flex items-center justify-between gap-3">
        <SkeletonBar className="h-10 w-36 rounded-xl" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <SkeletonBlock className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <SkeletonBar className="h-11 w-full max-w-md" />
      <SkeletonBar className="h-6 max-w-sm w-[66%]" />
      <SkeletonBlock className="h-52 w-full sm:h-60" />
      <SkeletonBar className="h-7 w-40" />
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    </div>
  );
}

function AdminPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 gap-0 lg:gap-6">
      <div className="hidden w-16 shrink-0 flex-col gap-3 px-2 py-6 lg:flex">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="mx-auto h-10 w-10 rounded-2xl" />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-5 px-4 py-6 md:px-8">
        <SkeletonBar className="h-10 w-48" />
        <SkeletonBar className="h-6 w-72 max-w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28 w-full" />
          ))}
        </div>
        <SkeletonBlock className="h-36 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    </div>
  );
}

function LoadingExperienceBar() {
  return (
    <div className="mx-auto w-full max-w-md px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
      <p className="mb-3 text-center text-sm font-medium tracking-tight text-[var(--ink-muted)]">
        Carregando experiência
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]"
        role="progressbar"
        aria-valuetext="Carregando experiência"
      >
        <div className="experience-progress-bar h-full w-1/3 rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}

export function ExperiencePreloader({
  variant = "cliente",
  className,
}: {
  variant?: "cliente" | "admin";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-between bg-[var(--bg)]",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando experiência"
    >
      <div className="min-h-0 flex-1 overflow-hidden py-2">
        {variant === "admin" ? <AdminPageSkeleton /> : <ClientePageSkeleton />}
      </div>
      <LoadingExperienceBar />
    </div>
  );
}

/** Full-screen overlay — visual only; does not block React/hydration underneath. */
export function ExperiencePreloaderOverlay({
  variant = "cliente",
  active,
}: {
  variant?: "cliente" | "admin";
  active: boolean;
}) {
  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="experience-preloader-overlay fixed inset-0 z-[120] flex flex-col bg-[var(--bg)]"
      aria-busy="true"
      aria-live="polite"
    >
      <ExperiencePreloader variant={variant} className="min-h-screen" />
    </div>,
    document.body,
  );
}
