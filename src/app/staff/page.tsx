import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, ClipboardCheck, Bookmark } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { ReservationCard } from "@/components/reservations/reservation-card";
import { PickupQueue } from "@/components/reservations/pickup-queue";
import {
  listQuitadasForPickup,
  listRecentReservations,
} from "@/lib/reservations/queries";
import { listRecentContributions } from "@/lib/wallet/queries";
import { ContributionList } from "@/components/wallet/contribution-list";
import { AdminConfirmContributionButton } from "@/components/wallet/admin-confirm-button";
import { formatCentsBRL } from "@/lib/utils";
import { CONTRIBUTION_STATUS_LABEL } from "@/lib/wallet/types";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const { reservations } = await listRecentReservations(8);
  const { reservations: quitadas } = await listQuitadasForPickup({ limit: 24 });
  const { contributions } = await listRecentContributions(12);
  const activeCount = reservations.filter((r) => r.status === "ativa").length;
  const pendingContribs = contributions.filter((c) => c.status === "pending");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação"
        title="Staff"
        description="Clientes, retiradas e avaliações."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Clientes ativos", value: "—" },
          { label: "Reservas recentes ativas", value: String(activeCount) },
          { label: "Fila de retirada", value: String(quitadas.length) },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-[var(--ink-muted)]">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      <section id="retiradas">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Prontas para retirada
          </h2>
          <Pill tone="accent">{quitadas.length}</Pill>
        </div>
        <PickupQueue reservations={quitadas} />
      </section>

      <section id="reservas">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Reservas recentes</h2>
            <Pill tone="accent">ops</Pill>
          </div>
          <Link href="/staff/reservas">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </div>
        {reservations.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-6 w-6" />}
            title="Nenhuma reserva ainda"
            description="Quando clientes reservarem no catálogo, elas aparecem aqui."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </section>

      <section id="aportes">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Aportes recentes</h2>
          <Pill tone="accent">ops</Pill>
        </div>
        {contributions.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="Nenhum aporte ainda"
            description="Quando clientes gerarem Pix, os aportes aparecem aqui."
          />
        ) : (
          <div className="space-y-3">
            <ContributionList contributions={contributions} />
            {pendingContribs.length > 0 ? (
              <Card className="space-y-3">
                <p className="text-sm text-[var(--ink-muted)]">
                  Confirmação manual (sem gateway) — staff/admin:
                </p>
                <ul className="space-y-2">
                  {pendingContribs.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <span className="text-sm">
                        {formatCentsBRL(c.amount_cents)} ·{" "}
                        {CONTRIBUTION_STATUS_LABEL[c.status]}
                      </span>
                      <AdminConfirmContributionButton contributionId={c.id} />
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        )}
      </section>

      <section id="clientes">
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
            <p className="mt-1 text-[var(--ink-muted)]">
              Busca por nome/telefone e histórico de reservas.
            </p>
          </div>
          <Link href="/staff/clientes">
            <Button variant="accent" leftIcon={<Users className="h-4 w-4" />}>
              Abrir clientes
            </Button>
          </Link>
        </Card>
      </section>


      <section id="avaliacoes" className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Avaliações</h2>
          <Pill>placeholder</Pill>
        </div>
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="Fila de avaliações"
          description="TODO: score de risco / aprovação de reservas especiais."
        />
      </section>
    </div>
  );
}
