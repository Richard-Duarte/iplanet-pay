"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

type PickupRow = {
  id: string;
  mode: string;
  status: string;
  shipping_method: string | null;
  created_at: string;
  reservation_id: string;
  profiles?: { full_name: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  in_transit: "Em trânsito",
  ready_pickup: "Pronto na loja",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function PickupRequestsPanel() {
  const [rows, setRows] = useState<PickupRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/pickup-requests");
        const data = (await res.json()) as { ok?: boolean; rows?: PickupRow[]; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Falha ao carregar.");
          return;
        }
        setRows(data.rows ?? []);
      } catch {
        setError("Erro de rede.");
      }
    })();
  }, []);

  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-bold">Solicitações de retirada / envio</h2>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--ink-muted)]">Nenhuma solicitação recente.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-semibold">
                  {r.profiles?.full_name ?? "Cliente"} ·{" "}
                  {r.mode === "store" ? "Loja" : "Envio"}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                  {r.shipping_method ? ` · ${r.shipping_method}` : ""}
                </p>
              </div>
              <Pill tone="lavender">{STATUS_LABEL[r.status] ?? r.status}</Pill>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
