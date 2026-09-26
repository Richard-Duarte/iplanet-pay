"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MotionModal } from "@/components/ui/motion";
import { formatCentsBRL } from "@/lib/utils";
import { Package, Truck } from "lucide-react";

type Step = "mode" | "shipping" | "address" | "loan" | "freight" | "done";

const SHIPPING_METHODS = [
  { id: "sedex", label: "SEDEX", freightCents: 4500, insuranceCents: 1200 },
  { id: "pac", label: "PAC", freightCents: 2800, insuranceCents: 900 },
  { id: "motoboy", label: "Motoboy (capital)", freightCents: 3500, insuranceCents: 800 },
] as const;

export function SolicitarRetiradaWizard({
  reservationId,
  progressPct,
  storeName,
}: {
  reservationId: string;
  progressPct: number;
  storeName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<"store" | "shipping" | null>(null);
  const [shippingMethod, setShippingMethod] = useState<string>("sedex");
  const [address, setAddress] = useState({
    street: "",
    number: "",
    city: "",
    state: "",
    zip: "",
  });
  const [loanAccepted, setLoanAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const needsLoan = progressPct >= 70 && progressPct < 100;
  const canStart = progressPct >= 70;

  const freight = useMemo(() => {
    const m = SHIPPING_METHODS.find((x) => x.id === shippingMethod);
    return m ?? SHIPPING_METHODS[0];
  }, [shippingMethod]);

  const totalFreight = freight.freightCents + freight.insuranceCents;

  async function submitStore() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "store",
          loan_contract_signed: needsLoan ? loanAccepted : true,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Falha ao registrar retirada.");
        return;
      }
      setStep("done");
      router.refresh();
    } catch {
      setMessage("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  async function submitShipping() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "shipping",
          shipping_method: shippingMethod,
          address,
          freight_cents: freight.freightCents,
          insurance_cents: freight.insuranceCents,
          loan_contract_signed: needsLoan ? loanAccepted : true,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        pix?: { contribution_id?: string };
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Falha ao registrar envio.");
        return;
      }
      setStep("done");
      router.refresh();
    } catch {
      setMessage("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  if (!canStart) return null;

  return (
    <>
      <Button
        type="button"
        variant="accent"
        size="md"
        leftIcon={<Package className="h-4 w-4" />}
        onClick={() => {
          setOpen(true);
          setStep("mode");
          setMessage(null);
        }}
      >
        Solicitar retirada
      </Button>

      <MotionModal open={open} onClose={() => !loading && setOpen(false)} labelledBy="retirada-title">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <h2 id="retirada-title" className="text-lg font-bold">
            Solicitar retirada
          </h2>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {step === "mode" ? (
            <>
              <p className="text-sm text-[var(--ink-muted)]">
                Escolha como deseja receber o aparelho.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl border border-[var(--line)] p-4 text-left hover:border-[var(--accent)]"
                  onClick={() => {
                    setMode("store");
                    if (needsLoan && progressPct < 100) setStep("loan");
                    else void submitStore();
                  }}
                >
                  <Package className="mb-2 h-6 w-6 text-[var(--accent)]" />
                  <p className="font-semibold">Retirar na loja</p>
                  <p className="text-xs text-[var(--ink-muted)]">{storeName}</p>
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-[var(--line)] p-4 text-left hover:border-[var(--accent)]"
                  onClick={() => {
                    setMode("shipping");
                    setStep(needsLoan && progressPct < 100 ? "loan" : "shipping");
                  }}
                >
                  <Truck className="mb-2 h-6 w-6 text-[var(--accent)]" />
                  <p className="font-semibold">Enviar para mim</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Frete + seguro via Pix
                  </p>
                </button>
              </div>
            </>
          ) : null}

          {step === "loan" ? (
            <>
              <p className="text-sm text-[var(--ink-muted)]">
                Entrega antecipada ({progressPct}%): você assina contrato de empréstimo
                do aparelho até quitar 100% dos aportes.
              </p>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={loanAccepted}
                  onChange={(e) => setLoanAccepted(e.target.checked)}
                />
                Li e aceito o contrato de empréstimo até conclusão dos pagamentos.
              </label>
              <Button
                type="button"
                disabled={!loanAccepted || loading}
                onClick={() => {
                  if (mode === "store") void submitStore();
                  else setStep("shipping");
                }}
              >
                {mode === "store"
                  ? loading
                    ? "Enviando…"
                    : "Confirmar retirada na loja"
                  : "Continuar para endereço"}
              </Button>
            </>
          ) : null}

          {step === "shipping" ? (
            <>
              <Select
                label="Forma de envio"
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
              >
                {SHIPPING_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {formatCentsBRL(m.freightCents + m.insuranceCents)}
                  </option>
                ))}
              </Select>
              <Input label="Rua" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
              <Input label="Número" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
              <Input label="Cidade" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <Input label="UF" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              <Input label="CEP" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
              <Button type="button" onClick={() => setStep("freight")}>
                Revisar frete
              </Button>
            </>
          ) : null}

          {step === "freight" ? (
            <>
              <div className="rounded-2xl bg-[var(--bg-subtle)] p-4 text-sm">
                <p>Frete: {formatCentsBRL(freight.freightCents)}</p>
                <p>Seguro: {formatCentsBRL(freight.insuranceCents)}</p>
                <p className="mt-2 font-bold">Total Pix: {formatCentsBRL(totalFreight)}</p>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                Ao confirmar, geramos Pix de frete + seguro vinculado à sua reserva.
              </p>
              <Button type="button" disabled={loading} onClick={() => void submitShipping()}>
                {loading ? "Gerando…" : "Pagar frete via Pix"}
              </Button>
            </>
          ) : null}

          {step === "done" ? (
            <p className="text-sm text-[var(--ink-muted)]">
              Solicitação registrada. Acompanhe o status nesta reserva.
            </p>
          ) : null}

          {message ? <p className="text-sm text-[var(--danger)]">{message}</p> : null}
        </div>
      </MotionModal>
    </>
  );
}
