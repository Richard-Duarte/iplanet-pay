import Link from "next/link";
import { QrCode, Smartphone, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProductHeroCard } from "@/components/ui/product-hero-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ReservationCard } from "@/components/reservations/reservation-card";
import { getCurrentUser } from "@/lib/auth/session";
import { listMyReservations } from "@/lib/reservations/queries";
import {
  productSubtitle,
  reservationProgress,
  reservationRemainingCents,
} from "@/lib/reservations/types";
import { formatCentsBRL } from "@/lib/utils";

export const metadata = { title: "Início" };

export default async function ClienteHomePage() {
  const user = await getCurrentUser();
  const { reservations, error } = user
    ? await listMyReservations(user.id)
    : { reservations: [], error: null };

  const active = reservations.filter((r) => r.status === "ativa");
  const [hero, ...rest] = active;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sua reserva"
        title="Continue no seu ritmo"
        description="Acompanhe o aporte, pague com Pix e explore o catálogo."
        size="lg"
      />

      {error ? (
        <EmptyState
          icon={<Smartphone className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      ) : !hero ? (
        <EmptyState
          icon={<Smartphone className="h-6 w-6" />}
          title="Nenhuma reserva ativa"
          description="Escolha um iPhone no catálogo. O Pix de aporte chega em breve."
          action={
            <Link href="/app/catalogo">
              <Button variant="accent" leftIcon={<Smartphone className="h-4 w-4" />}>
                Ver catálogo
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <ProductHeroCard
            badge="Reserva ativa"
            title={hero.product?.name ?? "Reserva"}
            subtitle={productSubtitle(hero.product, hero.store)}
            priceLabel={`${formatCentsBRL(reservationRemainingCents(hero))} restantes`}
            footer={
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <ProgressRing
                  value={reservationProgress(hero)}
                  label="quitado"
                />
                <div className="flex-1 space-y-4">
                  <ProgressBar
                    value={reservationProgress(hero)}
                    label="Progresso da reserva"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/app/reserva/${hero.id}`}>
                      <Button size="sm">
                        Ver reserva
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="accent"
                      disabled
                      leftIcon={<QrCode className="h-4 w-4" />}
                    >
                      Aporte Pix (em breve)
                    </Button>
                  </div>
                </div>
              </div>
            }
          />
          {rest.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {rest.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  href={`/app/reserva/${r.id}`}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Minhas reservas</h2>
        <Link
          href="/app/reservas"
          className="text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Pill tone="lavender">Atalho</Pill>
          <h3 className="mt-3 text-2xl font-bold tracking-tight">Catálogo</h3>
          <p className="mt-2 text-[var(--ink-muted)]">
            Veja modelos disponíveis para nova reserva.
          </p>
          <Link href="/app/catalogo" className="mt-5 inline-block">
            <Button variant="outline" leftIcon={<Smartphone className="h-4 w-4" />}>
              Abrir catálogo
            </Button>
          </Link>
        </Card>
        <Card>
          <Pill tone="accent">Carteira</Pill>
          <h3 className="mt-3 text-2xl font-bold tracking-tight">Saldo & Pix</h3>
          <p className="mt-2 text-[var(--ink-muted)]">
            Placeholder da carteira e histórico de aportes.
          </p>
          <Link href="/app/carteira" className="mt-5 inline-block">
            <Button variant="ghost">Ir para carteira →</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
