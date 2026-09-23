"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { MotionModal } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCentsBRL } from "@/lib/utils";
import type { Product } from "@/types/database";

const DRAFT_KEY = "iplanet_goal_draft";

function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = years * 12 + (to.getMonth() - from.getMonth());
  const dayAdj = to.getDate() >= from.getDate() ? 0 : -1;
  return Math.max(1, months + dayAdj || 1);
}

function galleryFor(product: Product): string[] {
  const extras = (product.product_images ?? []).filter(Boolean);
  const main = product.image_url ? [product.image_url] : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [...main, ...extras]) {
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

export function ProductModal({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [installments, setInstallments] = useState(12);
  const [cadastrarMeta, setCadastrarMeta] = useState(false);
  const [metaName, setMetaName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [reminderLocal, setReminderLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!product) return;
    setInstallments(12);
    setCadastrarMeta(false);
    setMetaName(`Meta · ${product.name}`);
    setTargetDate("");
    setReminderLocal("");
    setError(null);
    setImgIdx(0);
  }, [product?.id]);

  const gallery = useMemo(
    () => (product ? galleryFor(product) : []),
    [product],
  );

  const price = product?.list_price_cents ?? 0;

  const effectiveInstallments = useMemo(() => {
    if (cadastrarMeta && targetDate) {
      const n = monthsBetween(new Date(), new Date(targetDate + "T12:00:00"));
      return Math.min(24, Math.max(2, n));
    }
    return Math.min(24, Math.max(2, installments));
  }, [cadastrarMeta, targetDate, installments]);

  const installmentCents = Math.floor(price / effectiveInstallments);

  function reserveHref() {
    if (!product) return "/criar-conta";
    return `/criar-conta?product=${encodeURIComponent(product.slug)}`;
  }

  function goReserve() {
    if (!product) return;
    onClose();
    router.push(reserveHref());
  }

  async function saveGoal() {
    if (!product) return;
    setSaving(true);
    setError(null);

    const draft = {
      product_id: product.id,
      product_slug: product.slug,
      name: metaName.trim() || `Meta · ${product.name}`,
      target_date: targetDate,
      reminder_at: reminderLocal
        ? new Date(reminderLocal).toISOString()
        : null,
      amount_cents: price,
      installment_cents: installmentCents,
      installments_count: effectiveInstallments,
    };

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        needsAuth?: boolean;
      };
      if (data.needsAuth || res.status === 401) {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        onClose();
        router.push(
          `/entrar?next=${encodeURIComponent("/app/catalogo?product=" + product.slug)}`,
        );
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível salvar a meta.");
        return;
      }
      onClose();
      router.push("/app/catalogo?meta=ok");
    } catch {
      setError("Erro de rede.");
    } finally {
      setSaving(false);
    }
  }

  if (!product) return null;

  return (
    <MotionModal
      open={open}
      onClose={onClose}
      labelledBy="product-modal-title"
      className="max-w-xl"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          {product.category ?? "Apple"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--ink)] transition hover:bg-[var(--line)]"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto px-5 py-4">
        <div className="relative flex h-56 items-center justify-center bg-white">
          {gallery[imgIdx] ? (
            <Image
              src={gallery[imgIdx]}
              alt={product.name}
              width={280}
              height={280}
              className="h-full w-auto object-contain mix-blend-multiply"
            />
          ) : (
            <div className="h-36 w-36 rounded-full bg-[var(--line)]" />
          )}
        </div>
        {gallery.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2">
            {gallery.map((u, i) => (
              <button
                key={u}
                type="button"
                onClick={() => setImgIdx(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === imgIdx ? "bg-[var(--accent)]" : "bg-[var(--line)]"
                }`}
                aria-label={`Imagem ${i + 1}`}
              />
            ))}
          </div>
        ) : null}

        <h2
          id="product-modal-title"
          className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)]"
        >
          {product.name}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {[product.storage, product.color].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-2 text-xl font-semibold text-[var(--ink)]">
          {formatCentsBRL(price)}
        </p>
        {product.description ? (
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-muted)]">
            {product.description}
          </p>
        ) : null}

        <div className="mt-6 rounded-[20px] border border-[var(--line)] bg-white p-4">
          <h3 className="text-sm font-bold text-[var(--ink)]">
            Simulador de aportes
          </h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Simulação de aportes · sem juros de cartão — você define o ritmo via
            Pix
          </p>
          {!cadastrarMeta || !targetDate ? (
            <label className="mt-3 block text-sm">
              <span className="font-medium">Número de parcelas</span>
              <input
                type="range"
                min={2}
                max={24}
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--accent)]"
              />
              <span className="mt-1 block text-[var(--ink-muted)]">
                {installments}× de {formatCentsBRL(Math.floor(price / installments))}
              </span>
            </label>
          ) : null}
          <div className="mt-3 rounded-2xl bg-[var(--accent-soft)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              Valor por mês
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {formatCentsBRL(installmentCents)}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              em {effectiveInstallments} aportes · entrada R$&nbsp;0
            </p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[16px] border border-[var(--line)] bg-white p-4">
          <input
            type="checkbox"
            checked={cadastrarMeta}
            onChange={(e) => setCadastrarMeta(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            <span className="block font-semibold text-[var(--ink)]">
              Cadastrar meta
            </span>
            <span className="text-sm text-[var(--ink-muted)]">
              Defina data, lembrete e ritmo de aportes (WhatsApp quando
              configurado).
            </span>
          </span>
        </label>

        {cadastrarMeta ? (
          <div className="mt-4 space-y-3 rounded-[20px] border border-[var(--line)] bg-[var(--bg-subtle)] p-4">
            <Input
              label="Nome da meta"
              value={metaName}
              onChange={(e) => setMetaName(e.target.value)}
              required
            />
            <Input
              label="Data de conclusão"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
            <Input
              label="Data do lembrete"
              type="datetime-local"
              value={reminderLocal}
              onChange={(e) => setReminderLocal(e.target.value)}
              hint="Opcional — enfileiramos aviso WhatsApp (stub sem API key)"
            />
            {targetDate ? (
              <p className="text-sm text-[var(--ink-muted)]">
                Até a data: ~{effectiveInstallments} meses ·{" "}
                {formatCentsBRL(installmentCents)}/mês
              </p>
            ) : null}
            {error ? (
              <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
            ) : null}
            <Button
              type="button"
              variant="accent"
              fullWidth
              disabled={saving || !targetDate}
              onClick={() => void saveGoal()}
            >
              {saving ? "Salvando…" : "Salvar meta"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--line)] bg-white px-5 py-4 sm:flex-row">
        <Button type="button" variant="accent" fullWidth onClick={goReserve}>
          Reservar / Criar conta
        </Button>
        <Button type="button" variant="outline" fullWidth onClick={onClose}>
          Fechar
        </Button>
      </div>
    </MotionModal>
  );
}

export { DRAFT_KEY as GOAL_DRAFT_KEY };
