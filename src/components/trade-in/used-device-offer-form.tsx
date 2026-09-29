"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Info, Wrench, Droplets, CloudUpload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAINTENANCE_OPTIONS,
  MAX_USED_DEVICE_PHOTOS,
  type MaintenanceOptionId,
} from "@/lib/trade-in/constants";

export function UsedDeviceOfferForm({
  reservationId,
  backHref,
}: {
  reservationId: string;
  backHref: string;
}) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [deviceModel, setDeviceModel] = useState("");
  const [imei, setImei] = useState("");
  const [expectedBrl, setExpectedBrl] = useState("");
  const [minimumBrl, setMinimumBrl] = useState("");
  const [maintenance, setMaintenance] = useState<MaintenanceOptionId[]>([
    "nunca_aberto",
  ]);
  /** null = not chosen yet */
  const [liquidExposure, setLiquidExposure] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maintenanceSet = useMemo(() => new Set(maintenance), [maintenance]);

  const photoPreviews = useMemo(
    () => photos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [photos],
  );

  useEffect(() => {
    return () => {
      for (const p of photoPreviews) URL.revokeObjectURL(p.url);
    };
  }, [photoPreviews]);

  function toggleMaintenance(id: MaintenanceOptionId) {
    if (id === "nunca_aberto") {
      setMaintenance(["nunca_aberto"]);
      return;
    }
    setMaintenance((prev) => {
      const next = prev.filter((x) => x !== "nunca_aberto");
      if (next.includes(id)) return next.filter((x) => x !== id);
      return [...next, id];
    });
  }

  function onPhotosChange(list: FileList | null) {
    if (!list?.length) return;
    const incoming = Array.from(list);
    setPhotos((prev) => {
      const merged = [...prev];
      for (const file of incoming) {
        if (merged.length >= MAX_USED_DEVICE_PHOTOS) break;
        const duplicate = merged.some(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified,
        );
        if (!duplicate) merged.push(file);
      }
      return merged;
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (liquidExposure === null) {
      setError("Informe se o aparelho teve exposição a líquidos (Sim ou Não).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("reservation_id", reservationId);
      fd.set("device_model", deviceModel);
      fd.set("imei", imei);
      fd.set("expected_value_brl", expectedBrl);
      fd.set("minimum_value_brl", minimumBrl);
      fd.set("maintenance_options", JSON.stringify(maintenance));
      fd.set("liquid_exposure", String(liquidExposure));
      for (const file of photos) {
        fd.append("photos", file);
      }

      const res = await fetch("/api/trade-in/submit", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível enviar.");
        return;
      }
      router.push(backHref);
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-2xl space-y-6 pb-8">
      <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
        Envie fotos e detalhes do seu aparelho atual para usá-lo como forma de pagamento na sua
        reserva.
      </p>

      <Card className="border-[var(--accent)]/25 bg-[var(--accent)]/5">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <Info className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          Como funciona?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          Você preenche as informações e nós fazemos uma proposta. Caso você aceite, o valor
          creditado será abatido do saldo da sua reserva imediatamente. O aparelho antigo só é
          recolhido na entrega do seu novo aparelho.
        </p>
      </Card>

      <Card className="space-y-5">
        <Field label="Modelo do aparelho">
          <Input
            placeholder="Ex: iPhone 11 Pro 64GB"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            required
          />
        </Field>

        <Field label="IMEI do aparelho">
          <Input
            placeholder="Digite o IMEI (digite *#06# no celular para ver)"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor esperado (R$)">
            <Input
              inputMode="decimal"
              placeholder="Ex: 1500"
              value={expectedBrl}
              onChange={(e) => setExpectedBrl(e.target.value)}
              required
            />
          </Field>
          <Field label="Valor mínimo aceito (R$)">
            <Input
              inputMode="decimal"
              placeholder="Ex: 1200"
              value={minimumBrl}
              onChange={(e) => setMinimumBrl(e.target.value)}
              required
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <Wrench className="h-4 w-4 text-[var(--ink-muted)]" />
          Qual(is) manutenção(ões) o aparelho já sofreu?
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MAINTENANCE_OPTIONS.map((opt) => {
            const selected = maintenanceSet.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleMaintenance(opt.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--ink)]"
                    : "border-[var(--line)] bg-white text-[var(--ink-muted)] hover:border-[var(--accent)]/40"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-[var(--line)]"
                  }`}
                >
                  {selected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <Droplets className="h-4 w-4 text-[var(--ink-muted)]" />
          Exposição a líquidos
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          O aparelho já caiu na água ou pegou umidade severa?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceButton
            selected={liquidExposure === false}
            onClick={() => setLiquidExposure(false)}
            label="Não"
          />
          <ChoiceButton
            selected={liquidExposure === true}
            onClick={() => setLiquidExposure(true)}
            label="Sim"
            tone="danger"
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-semibold text-[var(--ink)]">
          Fotos do aparelho (frente, verso, detalhes)
        </p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-10 text-center transition hover:border-[var(--accent)]/50">
          <CloudUpload className="h-8 w-8 text-[var(--ink-muted)]" />
          <span className="text-sm font-medium text-[var(--ink)]">
            Clique para selecionar até {MAX_USED_DEVICE_PHOTOS} fotos
          </span>
          <span className="text-xs text-[var(--ink-muted)]">
            Gabinete, tela ligada, avarias (se houver).
          </span>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={photos.length >= MAX_USED_DEVICE_PHOTOS}
            onChange={(e) => onPhotosChange(e.target.files)}
          />
        </label>

        {photos.length >= MAX_USED_DEVICE_PHOTOS ? (
          <p className="text-xs text-[var(--ink-muted)]">
            Limite de {MAX_USED_DEVICE_PHOTOS} fotos atingido. Remova uma para adicionar outra.
          </p>
        ) : photos.length > 0 ? (
          <p className="text-xs text-[var(--ink-muted)]">
            {photos.length} de {MAX_USED_DEVICE_PHOTOS} — clique acima para adicionar mais.
          </p>
        ) : null}

        {photoPreviews.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoPreviews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--line)] bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={`Foto ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition hover:bg-black/80"
                  aria-label={`Remover foto ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
        {loading ? "Enviando…" : "Enviar solicitação"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
      {children}
    </label>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
  tone = "default",
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  tone?: "default" | "danger";
}) {
  const selectedClass =
    tone === "danger"
      ? "border-red-500 bg-red-50 text-red-900"
      : "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--ink)]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${
        selected
          ? selectedClass
          : "border-[var(--line)] bg-white text-[var(--ink-muted)] hover:border-[var(--accent)]/40"
      }`}
    >
      {label}
    </button>
  );
}
