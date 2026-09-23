"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CancelReservationButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const ok = window.confirm(
      "Cancelar esta reserva? O aparelho volta ao estoque da loja.",
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
        disabled={loading}
        onClick={() => void submit()}
      >
        {loading ? "Cancelando..." : "Cancelar reserva"}
      </Button>
      {message ? (
        <p className="text-sm text-[var(--danger)]">{message}</p>
      ) : null}
    </div>
  );
}
