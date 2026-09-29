"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCentsBRL } from "@/lib/utils";
import {
  MAINTENANCE_OPTIONS,
  USED_DEVICE_STATUS_LABEL,
} from "@/lib/trade-in/constants";
import type { UsedDeviceOffer } from "@/lib/trade-in/types";

export function UsedDeviceOfferStatus({
  reservationId,
  offer,
  canSubmitNew,
}: {
  reservationId: string;
  offer: UsedDeviceOffer | null;
  canSubmitNew: boolean;
}) {
  const offerHref = `/app/reserva/${reservationId}/oferecimento-usado`;

  if (!offer && !canSubmitNew) return null;

  return (
    <div className="space-y-3 border-t border-[var(--line)] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--ink)]">Usado como pagamento</h3>
        {canSubmitNew ? (
          <Link href={offerHref}>
            <Button type="button" variant="outline" size="sm">
              Dar aparelho como pagamento
            </Button>
          </Link>
        ) : null}
      </div>

      {offer ? (
        <Card className="space-y-2 bg-[var(--bg-subtle)] p-4 text-sm">
          <p className="font-semibold text-[var(--ink)]">
            {USED_DEVICE_STATUS_LABEL[offer.status]}
          </p>
          <p className="text-[var(--ink-muted)]">
            {offer.device_model} · IMEI {offer.imei}
          </p>
          <p className="text-[var(--ink-muted)]">
            Solicitado em {new Date(offer.created_at).toLocaleString("pt-BR")}
          </p>
          <p className="text-[var(--ink-muted)]">
            Valor esperado {formatCentsBRL(offer.expected_value_cents)} · mínimo{" "}
            {formatCentsBRL(offer.minimum_value_cents)}
          </p>
          {offer.status === "approved" && offer.approved_value_cents ? (
            <p className="font-semibold text-[var(--accent)]">
              Crédito aplicado: {formatCentsBRL(offer.approved_value_cents)}
            </p>
          ) : null}
          {offer.admin_message ? (
            <p className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)]">
              <span className="font-semibold">Mensagem da iPlanet: </span>
              {offer.admin_message}
            </p>
          ) : null}
          {offer.status === "rejected" && canSubmitNew ? (
            <Link href={offerHref}>
              <Button type="button" variant="accent" size="sm" fullWidth>
                Enviar nova solicitação
              </Button>
            </Link>
          ) : null}
        </Card>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">
          Ofereça seu aparelho usado para abater do saldo da reserva após avaliação.
        </p>
      )}
    </div>
  );
}

export function maintenanceLabels(ids: string[]): string {
  const map = new Map(MAINTENANCE_OPTIONS.map((o) => [o.id, o.label]));
  return ids.map((id) => map.get(id as (typeof MAINTENANCE_OPTIONS)[number]["id"]) ?? id).join(", ");
}
