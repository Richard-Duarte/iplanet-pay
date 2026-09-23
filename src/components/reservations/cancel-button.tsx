"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCentsBRL } from "@/lib/utils";

export function CancelReservationButton({
  reservationId,
  amountPaidCents = 0,
  canCancel,
}: {
  reservationId: string;
  amountPaidCents?: number;
  /** When false, button disabled — reservation has aportes / paid balance */
  canCancel?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const zerada = canCancel ?? amountPaidCents === 0;

  async function submit() {
    if (!zerada) {
      setMessage(
        "Não é possível cancelar: a reserva já possui aportes. Só reservas zeradas (sem pagamento) podem ser canceladas.",
      );
      return;
    }

    const ok = window.confirm(
      "Cancelar esta reserva zerada? Esta ação não pode ser desfeita.",
    );
    if (!ok) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Não foi possível cancelar.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={loading || !zerada}
        title={
          zerada
            ? "Cancelar reserva zerada"
            : `Reserva com ${formatCentsBRL(amountPaidCents)} pagos — cancele só se zerada`
        }
        onClick={() => void submit()}
      >
        {loading ? "Cancelando..." : "Cancelar reserva"}
      </Button>
      {!zerada ? (
        <p className="max-w-[220px] text-xs text-[var(--ink-muted)]">
          Só reservas zeradas (sem aportes) podem ser canceladas.
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--danger)]">{message}</p>
      ) : null}
    </div>
  );
}
