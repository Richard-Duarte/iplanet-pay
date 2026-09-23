"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Settings } from "lucide-react";

type Status = { mercadopago: boolean; serviceRole: boolean };

export function GatewayStatusPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/gateway-status");
        const data = (await res.json()) as Status & { error?: string; ok?: boolean };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Falha ao consultar status.");
          return;
        }
        if (!cancelled) {
          setStatus({
            mercadopago: Boolean(data.mercadopago),
            serviceRole: Boolean(data.serviceRole),
          });
        }
      } catch {
        if (!cancelled) setError("Erro de rede.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Settings className="h-5 w-5 text-[var(--accent)]" />
        <h3 className="text-lg font-bold tracking-tight">Gateways (env)</h3>
      </div>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">
        Status somente leitura — valores secretos nunca são expostos.
      </p>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {!status && !error ? (
        <p className="text-sm text-[var(--ink-muted)]">Verificando…</p>
      ) : null}
      {status ? (
        <ul className="space-y-3">
          <li className="flex items-center justify-between gap-3">
            <span className="font-medium">Mercado Pago (ACCESS_TOKEN)</span>
            <Pill tone={status.mercadopago ? "accent" : "lavender"}>
              {status.mercadopago ? "configurado" : "ausente"}
            </Pill>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="font-medium">Supabase service role</span>
            <Pill tone={status.serviceRole ? "accent" : "lavender"}>
              {status.serviceRole ? "configurado" : "ausente"}
            </Pill>
          </li>
        </ul>
      ) : null}
    </Card>
  );
}
