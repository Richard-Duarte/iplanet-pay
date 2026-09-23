"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCentsBRL } from "@/lib/utils";

export function ReferralSettingsForm({
  initialBonusCents,
}: {
  initialBonusCents: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialBonusCents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const preview = Number(value);
  const previewLabel =
    Number.isFinite(preview) && preview >= 0 ? formatCentsBRL(preview) : "—";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "referral_bonus_amount_cents",
          value,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      setMessage("Salvo.");
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-bold tracking-tight">Bônus de indicação</h3>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Valor em centavos creditado ao indicador (ex.: 5000 = R$ 50,00).
      </p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <Input
          label="referral_bonus_amount_cents"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          hint={`Prévia: ${previewLabel}`}
          required
        />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
        <Button type="submit" variant="accent" disabled={loading}>
          {loading ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}
