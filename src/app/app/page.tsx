import Link from "next/link";
import { QrCode, Smartphone, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProductHeroCard } from "@/components/ui/product-hero-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Início" };

export default function ClienteHomePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sua reserva"
        title="Continue no seu ritmo"
        description="Acompanhe o aporte, pague com Pix e explore o catálogo."
        size="lg"
      />

      <ProductHeroCard
        badge="Reserva ativa"
        title="iPhone 15"
        subtitle="128 GB · Preto · Itaim Bibi"
        priceLabel="R$ 4.200 restantes"
        footer={
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <ProgressRing value={42} label="quitado" />
            <div className="flex-1 space-y-4">
              <ProgressBar value={42} label="Progresso da reserva" />
              <div className="flex flex-wrap gap-2">
                <Link href="/app/reserva/demo-1">
                  <Button size="sm">
                    Ver reserva
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="sm" variant="accent" leftIcon={<QrCode className="h-4 w-4" />}>
                  Aporte Pix
                </Button>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                TODO: integrar geração Pix / webhook de crédito atômico.
              </p>
            </div>
          </div>
        }
      />

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
