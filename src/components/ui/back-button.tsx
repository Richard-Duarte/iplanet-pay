"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  fallbackHref = "/",
  label = "Voltar",
  className,
}: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--bg-subtle)] active:scale-[0.98]",
        className,
      )}
    >
      <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
      <span className="pr-2">{label}</span>
    </button>
  );
}
