import { cn } from "@/lib/utils";

export function RouteLoadingShell({
  variant = "cliente",
}: {
  variant?: "cliente" | "admin";
}) {
  return (
    <div
      className={cn(
        "animate-pulse space-y-5",
        variant === "admin" && "max-w-6xl",
      )}
      aria-busy
      aria-label="Carregando"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-40 rounded-xl bg-[var(--line)]/60" />
        <div className="h-9 w-24 rounded-xl bg-[var(--line)]/40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-36 rounded-2xl bg-[var(--line)]/50 sm:col-span-2 lg:col-span-1" />
        <div className="h-36 rounded-2xl bg-[var(--line)]/40" />
        <div className="h-36 rounded-2xl bg-[var(--line)]/40" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full max-w-md rounded bg-[var(--line)]/50" />
        <div className="h-4 w-full max-w-sm rounded bg-[var(--line)]/40" />
        <div className="h-28 rounded-2xl bg-[var(--line)]/35" />
      </div>
    </div>
  );
}
