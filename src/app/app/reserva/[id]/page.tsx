import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationStatusPill } from "@/components/reservations/status-pill";
import { CancelReservationButton } from "@/components/reservations/cancel-button";
import { SwitchDeviceButton } from "@/components/reservations/switch-device-button";
import { ConfirmRetiradaButton } from "@/components/reservations/confirm-retirada-button";
import { GerarPixForm } from "@/components/pix/gerar-pix-form";
import { ContributionList } from "@/components/wallet/contribution-list";
import { getCurrentUser } from "@/lib/auth/session";
import { getReservationById } from "@/lib/reservations/queries";
import { listCatalogProducts } from "@/lib/catalog/products";
import { listContributionsForReservation } from "@/lib/wallet/queries";
import {
  productSubtitle,
  reservationProgress,
  reservationRemainingCents,
  shortReservationId,
} from "@/lib/reservations/types";
import { formatCentsBRL } from "@/lib/utils";
import { Package } from "lucide-react";

export const metadata = { title: "Reserva" };

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const { reservation, error } = await getReservationById(id);

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Reserva" title="Detalhe" />
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      </div>
    );
  }

  if (!reservation) notFound();

  const { contributions } = await listContributionsForReservation(id);
  const progress = reservationProgress(reservation);
  const remaining = reservationRemainingCents(reservation);
  const title = reservation.product?.name ?? "Reserva";
  const subtitle = productSubtitle(reservation.product, reservation.store);
  const isOwner = user?.id === reservation.user_id;
  const canCancel = isOwner && reservation.status === "ativa";
  const canSwitchDevice =
    reservation.status === "ativa" &&
    (isOwner || user?.role === "staff" || user?.role === "admin");
  const canAportar = isOwner && reservation.status === "ativa" && remaining > 0;
  const canConfirmRetirada =
    reservation.status === "quitada" &&
    (user?.role === "staff" ||
      user?.role === "admin" ||
      user?.role === "parceiro");
  const storeName = reservation.store?.name ?? "a loja";
  const { products: catalogProducts } = canSwitchDevice
    ? await listCatalogProducts()
    : { products: [] };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reserva"
        title={title}
        description={`#${shortReservationId(reservation.id)}`}
        actions={
          <Link href="/app">
            <Button variant="ghost" size="sm">
              ← Voltar
            </Button>
          </Link>
        }
      />

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <ReservationStatusPill status={reservation.status} />
          {reservation.store ? (
            <Pill tone="lavender">{reservation.store.name}</Pill>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-[var(--ink-muted)]">{subtitle}</p>
        ) : null}

        {reservation.status === "quitada" ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-3">
            <p className="font-semibold text-[var(--ink)]">
              Pronto para retirada na loja {storeName}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Leve um documento com foto. A confirmação da retirada é feita pela
              equipe na loja.
            </p>
          </div>
        ) : null}

        {reservation.status === "retirada" ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-3">
            <p className="font-semibold text-[var(--ink)]">
              Aparelho retirado
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Esta reserva foi concluída com a retirada na loja.
            </p>
          </div>
        ) : null}

        {reservation.status === "trocada" ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-3">
            <p className="font-semibold text-[var(--ink)]">
              Reserva trocada
            </p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              O saldo foi transferido para um novo aparelho. Veja em{" "}
              <Link href="/app/reservas" className="font-semibold text-[var(--accent)]">
                Minhas reservas
              </Link>
              .
            </p>
          </div>
        ) : null}

        <ProgressBar value={progress} label="Aportes" />
        <div className="grid gap-3 text-sm text-[var(--ink-muted)] sm:grid-cols-2">
          <p>Total: {formatCentsBRL(reservation.list_price_cents)}</p>
          <p>Pago: {formatCentsBRL(reservation.amount_paid_cents)}</p>
          <p>Restante: {formatCentsBRL(remaining)}</p>
          <p>
            Criada em{" "}
            {new Date(reservation.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {canAportar ? (
          <GerarPixForm
            reservationId={reservation.id}
            remainingCents={remaining}
          />
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">
            {reservation.status === "quitada"
              ? "Reserva quitada — aportes encerrados."
              : reservation.status === "retirada"
                ? "Reserva concluída."
                : reservation.status === "trocada"
                  ? "Esta reserva foi trocada — aportes encerrados aqui."
                  : isOwner
                    ? "Não é possível gerar Pix nesta reserva."
                    : "Somente o dono da reserva pode gerar Pix."}
          </p>
        )}

        {canSwitchDevice ? (
          <SwitchDeviceButton
            reservationId={reservation.id}
            currentProductId={reservation.product_id}
            storeId={reservation.store_id}
            amountPaidCents={reservation.amount_paid_cents}
            products={catalogProducts}
          />
        ) : null}

        {canCancel ? (
          <CancelReservationButton reservationId={reservation.id} />
        ) : null}

        {canConfirmRetirada ? (
          <ConfirmRetiradaButton
            reservationId={reservation.id}
            productName={reservation.product?.name}
            size="md"
          />
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Histórico de aportes</h2>
        <ContributionList
          contributions={contributions}
          emptyLabel="Nenhum aporte nesta reserva ainda."
        />
      </Card>
    </div>
  );
}
