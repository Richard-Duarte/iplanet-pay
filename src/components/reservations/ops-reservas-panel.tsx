"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationStatusPill } from "@/components/reservations/status-pill";
import { CancelReservationButton } from "@/components/reservations/cancel-button";
import { ConfirmRetiradaButton } from "@/components/reservations/confirm-retirada-button";
import { formatCentsBRL } from "@/lib/utils";
import {
  ALL_RESERVATION_STATUSES,
  STATUS_LABEL,
  shortReservationId,
  type ReservationOpsRow,
  type ReservationStore,
} from "@/lib/reservations/types";

export function OpsReservasPanel({
  reservations,
  stores,
  lockStoreId,
  showCancel = true,
  showRetirada = true,
}: {
  reservations: ReservationOpsRow[];
  stores: ReservationStore[];
  lockStoreId?: string | null;
  showCancel?: boolean;
  showRetirada?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");

  const status = searchParams.get("status") ?? "";

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return reservations;
    return reservations.filter((r) => {
      const hay = [
        r.product?.name,
        r.client?.full_name,
        r.client?.phone,
        r.client?.email,
        r.id,
        shortReservationId(r.id),
        r.id.replace(/-/g, ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term) || hay.includes(term.replace(/-/g, ""));
    });
  }, [reservations, q]);

  const counts = useMemo(() => {
    const base = { ativa: 0, quitada: 0, cancelada: 0, retirada: 0 };
    for (const r of reservations) {
      if (r.status in base) base[r.status as keyof typeof base] += 1;
    }
    return base;
  }, [reservations]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["Ativas", counts.ativa, "text-[var(--accent)]"],
            ["Quitadas", counts.quitada, ""],
            ["Retiradas", counts.retirada, ""],
          ] as const
        ).map(([label, value, cls]) => (
          <Card key={label} className="bg-white">
            <p className="text-sm text-[var(--ink-muted)]">{label}</p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${cls}`}>
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produto, cliente, telefone ou ID…"
            className="pl-10"
            aria-label="Buscar reservas"
          />
        </div>
        <Select
          label="Status"
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
        >
          <option value="">Todos</option>
          {ALL_RESERVATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        {lockStoreId ? null : (
          <Select
            label="Loja"
            value={searchParams.get("store") ?? ""}
            onChange={(e) => updateParam("store", e.target.value)}
          >
            <option value="">Todas</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-6 w-6" />}
          title="Nenhuma reserva encontrada"
          description={
            q
              ? "Tente outro termo ou limpe a busca."
              : "Quando houver reservas, elas aparecem aqui."
          }
        />
      ) : (
        <>
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--bg-subtle)] text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Loja</th>
                  <th className="px-4 py-3 font-semibold text-right">Pago / Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {r.client?.full_name ?? "Cliente"}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {r.client?.phone ?? r.client?.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate font-medium">
                        {r.product?.name ?? "Produto"}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--ink-muted)]">
                        #{shortReservationId(r.id)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">
                      {r.store?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className="font-semibold text-[var(--accent)]">
                        {formatCentsBRL(r.amount_paid_cents)}
                      </span>
                      <span className="text-xs text-[var(--ink-muted)]">
                        {" "}
                        / {formatCentsBRL(r.list_price_cents)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ReservationStatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--ink-muted)]">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        {showCancel && r.status === "ativa" ? (
                          <CancelReservationButton reservationId={r.id} />
                        ) : null}
                        {showRetirada && r.status === "quitada" ? (
                          <ConfirmRetiradaButton
                            reservationId={r.id}
                            productName={r.product?.name}
                            size="sm"
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="grid gap-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ReservationStatusPill status={r.status} />
                  <span className="text-xs text-[var(--ink-muted)]">
                    #{shortReservationId(r.id)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    {r.product?.name ?? "Produto"}
                  </h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {r.client?.full_name ?? "Cliente"}
                    {r.client?.phone ? ` · ${r.client.phone}` : ""}
                  </p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {r.store?.name ?? "Loja"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className="text-sm">
                  <span className="font-semibold text-[var(--accent)]">
                    {formatCentsBRL(r.amount_paid_cents)}
                  </span>
                  <span className="text-[var(--ink-muted)]">
                    {" "}
                    / {formatCentsBRL(r.list_price_cents)}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {showCancel && r.status === "ativa" ? (
                    <CancelReservationButton reservationId={r.id} />
                  ) : null}
                  {showRetirada && r.status === "quitada" ? (
                    <ConfirmRetiradaButton
                      reservationId={r.id}
                      productName={r.product?.name}
                      size="sm"
                    />
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
