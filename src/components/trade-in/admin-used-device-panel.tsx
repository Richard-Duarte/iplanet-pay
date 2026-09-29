"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "@/components/ui/pill";
import { MotionModal } from "@/components/ui/motion";
import { formatCentsBRL } from "@/lib/utils";
import { USED_DEVICE_STATUS_LABEL } from "@/lib/trade-in/constants";
import type { UsedDeviceOfferWithProfile } from "@/lib/trade-in/types";
import { maintenanceLabels } from "@/components/trade-in/used-device-offer-status";

const STATUS_TONE: Record<string, "lavender" | "success" | "danger"> = {
  pending: "lavender",
  approved: "success",
  rejected: "danger",
};

export function AdminUsedDevicePanel() {
  const router = useRouter();
  const [rows, setRows] = useState<UsedDeviceOfferWithProfile[]>([]);
  const [status, setStatus] = useState("all");
  const [name, setName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<UsedDeviceOfferWithProfile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [approvedBrl, setApprovedBrl] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (name.trim()) params.set("name", name.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    try {
      const res = await fetch(`/api/admin/trade-in?${params.toString()}`);
      const data = (await res.json()) as {
        ok?: boolean;
        rows?: UsedDeviceOfferWithProfile[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Falha ao carregar.");
        return;
      }
      setRows(data.rows ?? []);
    } catch {
      setError("Erro de rede.");
    }
  }, [status, name, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(row: UsedDeviceOfferWithProfile) {
    setActive(row);
    setDecision(null);
    setAdminMessage("");
    setApprovedBrl((row.expected_value_cents / 100).toFixed(2));
    setPhotoUrls({});
    if (row.photo_paths.length === 0) return;
    try {
      const res = await fetch("/api/trade-in/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: row.id, paths: row.photo_paths }),
      });
      const data = (await res.json()) as { ok?: boolean; urls?: Record<string, string> };
      if (data.ok && data.urls) setPhotoUrls(data.urls);
    } catch {
      /* ignore */
    }
  }

  async function submitReview() {
    if (!active || !decision) return;
    setLoading(true);
    setError(null);
    try {
      let approvedValueCents: number | undefined;
      if (decision === "approve") {
        const n = Number(approvedBrl.replace(",", "."));
        if (!Number.isFinite(n) || n <= 0) {
          setError("Valor aprovado inválido.");
          setLoading(false);
          return;
        }
        approvedValueCents = Math.round(n * 100);
      }

      const res = await fetch("/api/admin/trade-in/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: active.id,
          action: decision,
          adminMessage: adminMessage.trim(),
          approvedValueCents,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Falha ao avaliar.");
        return;
      }
      setActive(null);
      setDecision(null);
      await load();
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Avaliação de usados</h2>

      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Nome do cliente" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Status</span>
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendente de Avaliação</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Recusado</option>
          </select>
        </label>
        <Input
          label="Data inicial"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          label="Data final"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="button" onClick={() => void load()}>
            Aplicar filtros
          </Button>
        </div>
      </Card>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <Card className="overflow-x-auto p-0">
        <ul className="divide-y divide-[var(--line)]">
          {rows.length === 0 ? (
            <li className="px-4 py-8 text-sm text-[var(--ink-muted)]">
              Nenhuma solicitação encontrada.
            </li>
          ) : (
            rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[var(--bg-subtle)] sm:px-5"
                  onClick={() => void openDetail(r)}
                >
                  <div>
                    <p className="font-semibold">{r.client_name ?? "Cliente"}</p>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {r.device_model} · {new Date(r.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Pill tone={STATUS_TONE[r.status] ?? "lavender"}>
                    {USED_DEVICE_STATUS_LABEL[r.status]}
                  </Pill>
                </button>
              </li>
            ))
          )}
        </ul>
      </Card>

      <MotionModal
        open={!!active}
        onClose={() => setActive(null)}
        labelledBy="avaliar-usado-title"
        className="h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none"
      >
        {active ? (
          <div className="flex max-h-[100dvh] flex-col bg-[#0a0a0a] text-white">
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <h2 id="avaliar-usado-title" className="text-lg font-semibold">
                Avaliar Aparelho do Cliente
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setActive(null)}>
                Fechar
              </Button>
            </header>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-white/50">Cliente</p>
                  <p className="font-semibold">{active.client_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-white/50">Modelo Oferecido</p>
                  <p className="font-semibold">{active.device_model}</p>
                </div>
                <div>
                  <p className="text-white/50">IMEI</p>
                  <p className="font-mono">{active.imei}</p>
                </div>
                <div>
                  <p className="text-white/50">Avaliação Desejada</p>
                  <p className="font-semibold text-emerald-400">
                    {formatCentsBRL(active.expected_value_cents)}
                  </p>
                  <p className="text-xs text-white/45">
                    Mínimo que aceita: {formatCentsBRL(active.minimum_value_cents)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 text-sm space-y-2">
                <p>
                  <span className="text-white/50">Manutenções: </span>
                  {maintenanceLabels(active.maintenance_options)}
                </p>
                <p>
                  <span className="text-white/50">Exposição a líquidos: </span>
                  {active.liquid_exposure ? "Sim, relatado" : "Não relatado"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Fotos Anexadas</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {active.photo_paths.map((path) => (
                    <div key={path} className="aspect-[3/4] overflow-hidden rounded-xl bg-[#222]">
                      {photoUrls[path] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrls[path]}
                          alt="Foto do aparelho"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-white/40">
                          Carregando…
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {active.status === "pending" ? (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold">Decisão</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={decision === "approve" ? "accent" : "outline"}
                      onClick={() => setDecision("approve")}
                    >
                      Aprovado
                    </Button>
                    <Button
                      type="button"
                      variant={decision === "reject" ? "accent" : "outline"}
                      onClick={() => setDecision("reject")}
                    >
                      Reprovado
                    </Button>
                  </div>
                  {decision === "approve" ? (
                    <Input
                      label="Valor aprovado (R$)"
                      value={approvedBrl}
                      onChange={(e) => setApprovedBrl(e.target.value)}
                    />
                  ) : null}
                  <Textarea
                    label={decision === "reject" ? "Motivo (obrigatório)" : "Mensagem (opcional)"}
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    rows={4}
                  />
                  <Button
                    type="button"
                    disabled={!decision || loading}
                    onClick={() => void submitReview()}
                  >
                    {loading ? "Salvando…" : "Confirmar avaliação"}
                  </Button>
                </div>
              ) : (
                <div
                  className={`rounded-2xl border p-4 ${
                    active.status === "rejected"
                      ? "border-red-500/40 bg-red-950/30"
                      : "border-emerald-500/30 bg-emerald-950/20"
                  }`}
                >
                  <p className="font-semibold">
                    {active.status === "rejected"
                      ? "Você rejeitou esta avaliação."
                      : "Avaliação aprovada."}
                  </p>
                  {active.admin_message ? (
                    <p className="mt-2 text-sm text-white/70">
                      <span className="font-semibold">Motivo: </span>
                      {active.admin_message}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </MotionModal>
    </section>
  );
}
