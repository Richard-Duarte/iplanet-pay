import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, Bookmark } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { ReservationCard } from "@/components/reservations/reservation-card";
import { PickupQueue } from "@/components/reservations/pickup-queue";
import {
  listQuitadasForPickup,
  listRecentReservations,
} from "@/lib/reservations/queries";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Parceiro" };

export default async function ParceiroPage() {
  const user = await getCurrentUser();
  // Parceiro com store_id: fila só da loja; sem vínculo: todas (mesmo padrão do RPC).
  const storeScope =
    user?.role === "parceiro" ? (user.store_id ?? null) : null;

  const { reservations } = await listRecentReservations(8);
  const { reservations: quitadas } = await listQuitadasForPickup({
    storeId: storeScope,
    limit: 24,
  });
  const activeCount = reservations.filter((r) => r.status === "ativa").length;
  const retiradaToday = reservations.filter((r) => {
    if (r.status !== "retirada") return false;
    const d = new Date(r.updated_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Loja parceira"
        title="Dashboard"
        description="Estoque, reservas e fila de retirada."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Itens em estoque", value: "—" },
          { label: "Reservas ativas", value: String(activeCount) },
          { label: "Retiradas hoje", value: String(retiradaToday) },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-[var(--ink-muted)]">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      <section id="pedidos" className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Prontas para retirada
          </h2>
          <Pill tone="accent">{quitadas.length}</Pill>
        </div>
        <PickupQueue reservations={quitadas} />
      </section>

      <section id="reservas" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Reservas recentes</h2>
            <Pill tone="lavender">loja</Pill>
          </div>
          <Link href="/parceiro/reservas">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </div>
        {reservations.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-6 w-6" />}
            title="Nenhuma reserva ainda"
            description="Reservas dos clientes aparecem aqui para conferência da loja."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )}
      </section>

      <section id="estoque" className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Estoque</h2>
          <Pill tone="lavender">placeholder</Pill>
        </div>
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Estoque ainda não conectado"
          description="TODO: sync de SKUs, reservas e disponibilidade por loja."
        />
      </section>
    </div>
  );
}
