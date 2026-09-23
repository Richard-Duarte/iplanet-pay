"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCentsBRL } from "@/lib/utils";

type PixPayload = {
  copy_paste: string;
  qr_base64: string;
  charge_id: string;
  provider: string;
};

export function GerarPixForm({
  reservationId,
  remainingCents,
  disabled,
}: {
  reservationId: string;
  remainingCents: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const defaultBrl = Math.min(50, Math.max(5, remainingCents / 100));
  const [amountBrl, setAmountBrl] = useState(
    Number.isFinite(defaultBrl) ? defaultBrl.toFixed(2) : "5.00",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pix, setPix] = useState<PixPayload | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    setMessage(null);
    setPix(null);
    setCopied(false);
    try {
      const res = await fetch("/api/pix/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservationId,
          amount_brl: amountBrl,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        gateway_configured?: boolean;
        pix?: PixPayload | null;
        amount_cents?: number;
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Não foi possível gerar o Pix.");
        return;
      }
      if (data.pix?.copy_paste) {
        setPix(data.pix);
        setMessage(
          data.amount_cents
            ? `Aporte de ${formatCentsBRL(data.amount_cents)} criado. Pague o Pix abaixo.`
            : "Pix gerado. Pague com o código abaixo.",
        );
      } else {
        setMessage(
          data.error ??
            "Aporte pendente criado, mas o gateway Pix não está configurado.",
        );
      }
      router.refresh();
    } catch {
      setMessage("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!pix?.copy_paste) return;
    try {
      await navigator.clipboard.writeText(pix.copy_paste);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <Input
          label="Valor do aporte (R$)"
          hint={`Mínimo R$ 5,00 · restante ${formatCentsBRL(remainingCents)}`}
          name="amount_brl"
          inputMode="decimal"
          value={amountBrl}
          onChange={(e) => setAmountBrl(e.target.value)}
          disabled={disabled || loading}
        />
        <Button
          type="submit"
          variant="accent"
          disabled={disabled || loading || remainingCents <= 0}
          fullWidth
        >
          {loading ? "Gerando Pix..." : "Gerar Pix"}
        </Button>
      </form>

      {message ? (
        <p
          className={`text-sm ${
            pix ? "text-[var(--ink)]" : "text-[var(--danger)]"
          }`}
        >
          {message}
        </p>
      ) : null}

      {pix ? (
        <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-subtle)] p-4">
          {pix.qr_base64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                pix.qr_base64.startsWith("data:")
                  ? pix.qr_base64
                  : `data:image/png;base64,${pix.qr_base64}`
              }
              alt="QR Code Pix"
              className="mx-auto h-48 w-48 rounded-xl bg-white p-2"
            />
          ) : null}
          <p className="break-all text-xs text-[var(--ink-muted)]">
            {pix.copy_paste}
          </p>
          <Button type="button" variant="outline" onClick={() => void copyCode()}>
            {copied ? "Copiado!" : "Copiar código Pix"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
