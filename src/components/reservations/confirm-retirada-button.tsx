"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConfirmRetiradaButton({
  reservationId,
  productName,
  size = "sm",
}: {
  reservationId: string;
  productName?: string | null;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const label = productName ? ` (${productName})` : "";
    const ok = window.confirm(
      `Confirmar retirada do aparelho${label}? O status passará para Retirada.`,
    );
    if (!ok) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/retirada`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Não foi possível confirmar a retirada.");
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
        variant="accent"
        size={size}
        disabled={loading}
        onClick={() => void submit()}
      >
        {loading ? "Confirmando..." : "Confirmar retirada"}
      </Button>
      {message ? (
        <p className="text-sm text-[var(--danger)]">{message}</p>
      ) : null}
    </div>
  );
}
