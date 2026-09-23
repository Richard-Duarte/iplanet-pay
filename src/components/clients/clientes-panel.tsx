"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { ReservationStatusPill } from "@/components/reservations/status-pill";
import { formatCentsBRL } from "@/lib/utils";
import type {
  ClientListItem,
  ClientReservationRow,
} from "@/lib/clients/queries";
import type { Store } from "@/types/database";
import type { UserRole } from "@/types/auth";

const ROLE_OPTIONS: Array<"cliente" | "admin"> = ["cliente", "admin"];

const ROLE_TONE: Record<UserRole, "neutral" | "accent" | "lavender"> = {
  cliente: "neutral",
  parceiro: "neutral",
  staff: "neutral",
  admin: "accent",
};

export function ClientesPanel({
  clients,
  stores,
  canEditRole,
  detailBasePath,
  initialReservations,
  initialSelectedId,
}: {
  clients: ClientListItem[];
  stores: Store[];
  canEditRole: boolean;
  detailBasePath: "/admin/clientes" | "/staff/clientes";
  initialReservations?: ClientReservationRow[];
  initialSelectedId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? null,
  );
  const [reservations, setReservations] = useState<ClientReservationRow[]>(
    initialReservations ?? [],
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [roleDraft, setRoleDraft] = useState<"cliente" | "admin">("cliente");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const phone = (c.phone ?? "").toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        phone.includes(q) ||
        phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      );
    });
  }, [clients, search]);

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  async function openDetail(client: ClientListItem) {
    setSelectedId(client.id);
    setRoleDraft(client.role === "admin" ? "admin" : "cliente");
    setError(null);
    setMessage(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(
        `/api/clients/${client.id}/reservations`,
        { method: "GET" },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        reservations?: ClientReservationRow[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setReservations([]);
        setError(data.error ?? "Não foi possível carregar reservas.");
        return;
      }
      setReservations(data.reservations ?? []);
    } catch {
      setReservations([]);
      setError("Erro de rede ao carregar reservas.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function saveRole() {
    if (!selected) return;
    setSavingRole(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          role: roleDraft,
          storeId: null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível alterar o papel.");
        return;
      }
      setMessage("Papel atualizado.");
      startTransition(() => router.refresh());
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone…"
          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-black/5"
        />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? (
        <p className="text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Nenhum cliente"
          description="Ajuste a busca ou aguarde novos cadastros."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,380px)]">
          <div className="space-y-3">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void openDetail(c)}
                className={`w-full rounded-[var(--radius-card)] border bg-white p-4 text-left transition ${
                  selectedId === c.id
                    ? "border-[var(--accent)] ring-4 ring-[var(--accent)]/10"
                    : "border-[var(--line)] hover:border-[var(--ink)]/30"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{c.full_name}</p>
                  <Pill tone={ROLE_TONE[c.role]}>{c.role}</Pill>
                </div>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {c.phone ?? "Sem telefone"}
                  {c.store_name ? ` · ${c.store_name}` : ""}
                </p>
                <p className="mt-2 text-sm">
                  {c.reservation_count} reservas ·{" "}
                  {formatCentsBRL(c.total_paid_cents)} pagos
                </p>
              </button>
            ))}
          </div>

          <Card className="h-fit bg-white lg:sticky lg:top-4">
            {!selected ? (
              <p className="text-sm text-[var(--ink-muted)]">
                Selecione um perfil para ver as reservas.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                    Detalhe
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{selected.full_name}</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {selected.phone ?? "Sem telefone"}
                  </p>
                </div>

                {canEditRole ? (
                  <div className="space-y-3 rounded-2xl border border-[var(--line)] p-3">
                    <Select
                      label="Papel"
                      value={roleDraft}
                      onChange={(e) =>
                        setRoleDraft(e.target.value as "cliente" | "admin")
                      }
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      variant="accent"
                      disabled={savingRole || pending}
                      onClick={() => void saveRole()}
                    >
                      {savingRole ? "Salvando…" : "Salvar papel"}
                    </Button>
                  </div>
                ) : (
                  <Pill tone={ROLE_TONE[selected.role]}>{selected.role}</Pill>
                )}

                <div>
                  <h4 className="font-bold">Reservas</h4>
                  {loadingDetail ? (
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      Carregando…
                    </p>
                  ) : reservations.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--ink-muted)]">
                      Nenhuma reserva.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {reservations.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-2xl border border-[var(--line)] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {r.product_name ?? "Produto"}
                            </p>
                            <ReservationStatusPill status={r.status} />
                          </div>
                          <p className="mt-1 text-xs text-[var(--ink-muted)]">
                            {r.store_name ?? "—"} ·{" "}
                            {formatCentsBRL(r.amount_paid_cents)} /{" "}
                            {formatCentsBRL(r.list_price_cents)}
                          </p>
                          <Link
                            href={`${detailBasePath.replace("/clientes", "/reservas")}?status=${r.status}`}
                            className="mt-2 inline-block text-xs font-semibold text-[var(--accent)] hover:underline"
                          >
                            Ver em reservas →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
