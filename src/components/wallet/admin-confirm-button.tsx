"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminConfirmContributionButton({
  contributionId,
}: {
  contributionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const ok = window.confirm(
      "Confirmar este aporte manualmente? O valor será creditado na reserva.",
    );
    if (!ok) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/contributions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribution_id: contributionId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Falha ao confirmar.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => void submit()}
      >
        {loading ? "Confirmando..." : "Confirmar (admin)"}
      </Button>
      {message ? (
        <p className="text-xs text-[var(--danger)]">{message}</p>
      ) : null}
    </div>
  );
}
