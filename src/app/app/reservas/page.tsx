import Link from "next/link";
import { Bookmark, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationCard } from "@/components/reservations/reservation-card";
import { StatusFilterChips } from "@/components/reservations/status-filter-chips";
import { getCurrentUser } from "@/lib/auth/session";
import { listOwnReservations } from "@/lib/reservations/queries";
import {
  isReservationStatus,
  type ReservationStatus,
} from "@/lib/reservations/types";
import { redirect } from "next/navigation";

export const metadata = { title: "Minhas reservas" };

export default async function MinhasReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/app/reservas");

  const sp = await searchParams;
  const statusFilter =
    sp.status && isReservationStatus(sp.status)
      ? (sp.status as ReservationStatus)
      : null;

  const { reservations, error } = await listOwnReservations(user.id, {
    status: statusFilter,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        showBack
        eyebrow="Cliente"
        title="Minhas reservas"
        description="Todas as suas reservas — filtre por status e abra o detalhe."
        actions={
          <Link href="/app/catalogo">
            <Button variant="outline" size="sm" leftIcon={<Smartphone className="h-4 w-4" />}>
              Catálogo
            </Button>
          </Link>
        }
      />

      <StatusFilterChips
        basePath="/app/reservas"
        activeStatus={statusFilter}
      />

      {error ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" />}
          title={
            statusFilter
              ? "Nenhuma reserva neste status"
              : "Você ainda não tem reservas"
          }
          description="Escolha um iPhone no catálogo para começar."
          action={
            <Link href="/app/catalogo">
              <Button variant="accent" leftIcon={<Smartphone className="h-4 w-4" />}>
                Ver catálogo
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reservations.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              href={`/app/reserva/${r.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
