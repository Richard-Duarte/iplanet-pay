import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ALL_RESERVATION_STATUSES,
  type ReservationStatus,
} from "@/lib/reservations/types";

const CHIP_LABEL: Record<string, string> = {
  "": "Todas",
  ativa: "Ativas",
  quitada: "Quitadas",
  cancelada: "Canceladas",
  retirada: "Retiradas",
  trocada: "Trocadas",
};

export function StatusFilterChips({
  basePath,
  activeStatus,
  extraParams,
}: {
  basePath: string;
  activeStatus?: ReservationStatus | null;
  extraParams?: Record<string, string | undefined | null>;
}) {
  function hrefFor(status: ReservationStatus | null) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        if (v) params.set(k, v);
      }
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(["", ...ALL_RESERVATION_STATUSES] as const).map((key) => {
        const status = (key || null) as ReservationStatus | null;
        const active = (activeStatus ?? null) === status;
        return (
          <Link
            key={key || "all"}
            href={hrefFor(status)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold tracking-wide transition",
              active
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-subtle)] text-[var(--ink-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]",
            )}
          >
            {CHIP_LABEL[key || ""] ?? key}
          </Link>
        );
      })}
    </div>
  );
}
