import { Pill } from "@/components/ui/pill";
import {
  CONTRIBUTION_STATUS_LABEL,
  type Contribution,
  type ContributionStatus,
} from "@/lib/wallet/types";
import { formatCentsBRL } from "@/lib/utils";

const TONE: Record<
  ContributionStatus,
  "neutral" | "accent" | "success" | "danger" | "lavender"
> = {
  pending: "accent",
  confirmed: "success",
  failed: "danger",
  refunded: "lavender",
  expired: "neutral",
};

export function ContributionList({
  contributions,
  emptyLabel = "Nenhum aporte ainda.",
}: {
  contributions: Contribution[];
  emptyLabel?: string;
}) {
  if (contributions.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-[var(--line)]">
      {contributions.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3"
        >
          <div>
            <p className="font-semibold">{formatCentsBRL(c.amount_cents)}</p>
            <p className="text-xs text-[var(--ink-muted)]">
              {new Date(c.created_at).toLocaleString("pt-BR")}
              {c.pix_code ? " · Pix" : ""}
            </p>
          </div>
          <Pill tone={TONE[c.status]}>
            {CONTRIBUTION_STATUS_LABEL[c.status]}
          </Pill>
        </li>
      ))}
    </ul>
  );
}
