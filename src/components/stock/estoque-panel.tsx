"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { formatCentsBRL } from "@/lib/utils";
import type { StockMatrixRow } from "@/lib/stock/queries";
import type { Store } from "@/types/database";

export function EstoquePanel({
  stores,
  rows,
  canEdit,
  canToggleActive,
  lockStoreId,
}: {
  stores: Store[];
  rows: StockMatrixRow[];
  canEdit: boolean;
  canToggleActive: boolean;
  lockStoreId?: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const p = r.product;
      return (
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        (p.color ?? "").toLowerCase().includes(q) ||
        p.storage.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  function draftKey(storeId: string, productId: string) {
    return `${storeId}:${productId}`;
  }

  async function saveQty(storeId: string, productId: string, current: number) {
    const key = draftKey(storeId, productId);
    const raw = draft[key];
    const qty =
      raw === undefined || raw === "" ? current : Number.parseInt(raw, 10);
    if (!Number.isFinite(qty) || qty < 0) {
      setError("Informe um inteiro ≥ 0.");
      return;
    }
    setSaving(key);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/stock/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, productId, qty }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível salvar o estoque.");
        return;
      }
      setMessage("Estoque atualizado.");
      setDraft((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(null);
    }
  }

  async function toggleActive(productId: string, active: boolean) {
    setSaving(`active:${productId}`);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, active: !active }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível alterar o status.");
        return;
      }
      setMessage(!active ? "Produto ativado." : "Produto desativado.");
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setSaving(null);
    }
  }

  if (stores.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
        title="Nenhuma loja"
        description="Cadastre lojas antes de gerenciar estoque."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto…"
          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-black/5"
        />
      </div>

      {error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Nenhum produto"
          description="Ajuste a busca ou cadastre produtos no catálogo."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ product, byStore }) => (
            <Card key={product.id} className="bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">
                      {product.name}
                    </h3>
                    <Pill tone={product.active ? "accent" : "neutral"}>
                      {product.active ? "Ativo" : "Inativo"}
                    </Pill>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {product.storage}
                    {product.color ? ` · ${product.color}` : ""} ·{" "}
                    {formatCentsBRL(product.list_price_cents)}
                  </p>
                </div>
                {canToggleActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving === `active:${product.id}`}
                    onClick={() =>
                      void toggleActive(product.id, product.active)
                    }
                  >
                    {product.active ? "Desativar" : "Ativar"}
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {stores.map((store) => {
                  if (lockStoreId && store.id !== lockStoreId) return null;
                  const qty = byStore[store.id] ?? 0;
                  const key = draftKey(store.id, product.id);
                  const value = draft[key] ?? String(qty);
                  return (
                    <div
                      key={store.id}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--bg-subtle)] p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                        {store.name}
                      </p>
                      {canEdit ? (
                        <div className="mt-2 flex items-end gap-2">
                          <Input
                            label="Qtd disponível"
                            type="number"
                            min={0}
                            step={1}
                            value={value}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                [key]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="accent"
                            disabled={saving === key}
                            onClick={() =>
                              void saveQty(store.id, product.id, qty)
                            }
                          >
                            {saving === key ? "…" : "Salvar"}
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-2 text-2xl font-bold">{qty}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
