"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Info, Wrench, Droplets, CloudUpload } from "lucide-react";
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
  const [deviceModel, setDeviceModel] = useState("");
  const [imei, setImei] = useState("");
  const [expectedBrl, setExpectedBrl] = useState("");
  const [minimumBrl, setMinimumBrl] = useState("");
  const [maintenance, setMaintenance] = useState<MaintenanceOptionId[]>([
    "nunca_aberto",
  ]);
  const [liquidExposure, setLiquidExposure] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maintenanceSet = useMemo(() => new Set(maintenance), [maintenance]);

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
    if (!list) return;
    const files = Array.from(list).slice(0, MAX_USED_DEVICE_PHOTOS);
    setPhotos(files);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
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
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur-md">
        <h1 className="text-lg font-semibold tracking-tight">Oferecimento de Usado</h1>
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </Link>
      </header>

      <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-28">
        <p className="text-sm leading-relaxed text-white/55">
          Envie fotos e detalhes do seu aparelho atual para usá-lo como forma de pagamento na
          sua reserva.
        </p>

        <div className="rounded-2xl border border-[#c9a227]/40 bg-[#141414] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#e8c547]">
            <Info className="h-4 w-4 shrink-0" />
            Como funciona?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Você preenche as informações e nós fazemos uma proposta. Caso você aceite, o valor
            creditado será abatido do saldo da sua reserva imediatamente. O aparelho antigo só
            é recolhido na entrega do seu novo aparelho.
          </p>
        </div>

        <Field label="Modelo do Aparelho">
          <input
            className={inputClass}
            placeholder="Ex: iPhone 11 Pro 64GB"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            required
          />
        </Field>

        <Field label="IMEI do Aparelho">
          <input
            className={inputClass}
            placeholder="Digite o IMEI (digite *#06# no celular para ver)"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor Esperado (R$)">
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="Ex: 1500"
              value={expectedBrl}
              onChange={(e) => setExpectedBrl(e.target.value)}
              required
            />
          </Field>
          <Field label="Valor Mínimo Aceito">
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="Ex: 1200"
              value={minimumBrl}
              onChange={(e) => setMinimumBrl(e.target.value)}
              required
            />
          </Field>
        </div>

        <section className="space-y-3 border-t border-white/10 pt-5">
          <p className="flex items-center gap-2 text-sm font-medium text-white/90">
            <Wrench className="h-4 w-4 text-white/50" />
            Qual(is) manutenção(ões) o aparelho já sofreu?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MAINTENANCE_OPTIONS.map((opt) => {
              const selected = maintenanceSet.has(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleMaintenance(opt.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                    selected
                      ? "border-[#c9a227] bg-[#c9a227]/10 text-white"
                      : "border-white/10 bg-[#121212] text-white/70"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-[#c9a227] bg-[#c9a227]" : "border-white/30"
                    }`}
                  >
                    {selected ? <span className="h-1.5 w-1.5 rounded-full bg-black" /> : null}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2 border-t border-white/10 pt-5">
          <p className="flex items-center gap-2 text-sm font-medium text-white/90">
            <Droplets className="h-4 w-4 text-white/50" />
            Exposição a Líquidos
          </p>
          <button
            type="button"
            onClick={() => setLiquidExposure((v) => !v)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
              liquidExposure
                ? "border-red-400/50 bg-red-950/40 text-red-200"
                : "border-white/10 bg-[#121212] text-white/70"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                liquidExposure ? "border-red-400 bg-red-500" : "border-white/30"
              }`}
            />
            O aparelho já caiu na água ou pegou umidade severa?
          </button>
        </section>

        <section className="space-y-2 border-t border-white/10 pt-5">
          <p className="text-sm font-medium text-white/90">
            Fotos do Aparelho (frente, verso, detalhes)
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-[#121212] px-4 py-10 text-center">
            <CloudUpload className="h-8 w-8 text-white/35" />
            <span className="text-sm font-medium text-white/80">
              Clique para selecionar até {MAX_USED_DEVICE_PHOTOS} fotos
            </span>
            <span className="text-xs text-white/45">
              Gabinete, tela ligada, avarias (se houver).
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => onPhotosChange(e.target.files)}
            />
          </label>
          {photos.length > 0 ? (
            <p className="text-xs text-white/50">{photos.length} foto(s) selecionada(s)</p>
          ) : null}
        </section>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="fixed bottom-0 left-0 right-0 mx-auto max-w-lg bg-[#0a0a0a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        >
          <span className="flex w-full items-center justify-center rounded-2xl bg-[#e8c547] py-4 text-base font-bold text-black disabled:opacity-60">
            {loading ? "Enviando…" : "Enviar solicitação"}
          </span>
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white/85">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#c9a227]/70";
