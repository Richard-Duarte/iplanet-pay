import { Card } from "@/components/ui/card";
import { formatCentsBRL } from "@/lib/utils";
import {
  calcWithdrawalAmounts,
  WITHDRAWAL_FEE_PCT_DEFAULT,
} from "@/lib/withdrawals/types";

export function WithdrawalFeeBreakdown({
  totalPaidCents,
  feePct = WITHDRAWAL_FEE_PCT_DEFAULT,
  compact = false,
}: {
  totalPaidCents: number;
  feePct?: number;
  compact?: boolean;
}) {
  const amounts = calcWithdrawalAmounts(totalPaidCents, feePct);

  return (
    <Card
      className={
        compact
          ? "space-y-2 bg-[var(--bg-subtle)] p-4 text-sm"
          : "space-y-3 bg-[var(--accent-soft)]/40 p-4 text-sm"
      }
    >
      {!compact ? (
        <p className="font-medium text-[var(--ink)]">
          Será descontada uma <strong>taxa administrativa de {feePct}%</strong> sobre
          os aportes confirmados elegíveis ao saque.
        </p>
      ) : null}
      <div className="space-y-2">
        <div className="flex justify-between gap-3">
          <span className="text-[var(--ink-muted)]">Aportes confirmados</span>
          <span className="font-semibold text-[var(--ink)]">
            {formatCentsBRL(totalPaidCents)}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-[var(--danger)]">
          <span>Taxa administrativa ({feePct}%)</span>
          <span className="font-semibold">
            − {formatCentsBRL(amounts.fee_amount_cents)}
          </span>
        </div>
        <div className="flex justify-between gap-3 border-t border-[var(--line)] pt-2">
          <span className="font-semibold text-[var(--ink)]">Você receberá</span>
          <span className="text-lg font-bold text-[var(--accent)]">
            {formatCentsBRL(amounts.refund_amount_cents)}
          </span>
        </div>
      </div>
    </Card>
  );
}
