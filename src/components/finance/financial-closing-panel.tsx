"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCentsBRL } from "@/lib/utils";
import type { FinancialClosing } from "@/lib/finance/closing";

export function FinancialClosingPanel({
  closings,
}: {
  closings: FinancialClosing[];
}) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [preview, setPreview] = useState<{
    total_revenue_cents: number;
    total_contributions_count: number;
    total_withdrawals_cents: number;
    net_cents: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPreview() {
    setLoading(true);
    setMessage(null);
    try {
      const q = new URLSearchParams({ start, end });
      const res = await fetch(`/api/admin/finance/closing/preview?${q}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Falha na prévia.");
        return;
      }
      setPreview(data.preview);
    } finally {
      setLoading(false);
    }
  }

  async function confirmClose() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/finance/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_start: start, period_end: end }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Falha ao fechar.");
        return;
      }
      setPreview(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Fechamento financeiro</h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Informe o intervalo (inclusive) para consolidar rendimentos do período.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Início" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Input label="Fim" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <Button type="button" disabled={!start || !end || loading} onClick={() => void loadPreview()}>
          Pré-visualizar
        </Button>
        {preview ? (
          <div className="rounded-2xl bg-[var(--bg-subtle)] p-4 text-sm">
            <p>Aportes: {formatCentsBRL(preview.total_revenue_cents)} ({preview.total_contributions_count})</p>
            <p>Saques: {formatCentsBRL(preview.total_withdrawals_cents)}</p>
            <p className="font-bold">Líquido: {formatCentsBRL(preview.net_cents)}</p>
            <Button type="button" className="mt-3" disabled={loading} onClick={() => void confirmClose()}>
              Confirmar fechamento
            </Button>
          </div>
        ) : null}
        {message ? <p className="text-sm text-[var(--danger)]">{message}</p> : null}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-bold">Fechamentos anteriores</h3>
        {closings.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">Nenhum fechamento ainda.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)] text-sm">
            {closings.map((c) => (
              <li key={c.id} className="flex justify-between py-2">
                <span>
                  {c.period_start} → {c.period_end}
                </span>
                <span className="font-semibold">{formatCentsBRL(c.net_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
