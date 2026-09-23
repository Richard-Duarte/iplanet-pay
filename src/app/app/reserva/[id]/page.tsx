import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Reserva" };

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reserva"
        title={`#${id}`}
        description="Detalhe placeholder da reserva e aportes."
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
          <Pill tone="accent">Ativa</Pill>
          <Pill tone="lavender">Itaim Bibi</Pill>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">iPhone 15 · 128 GB</h2>
        <ProgressBar value={42} label="Aportes" />
        <div className="grid gap-3 text-sm text-[var(--ink-muted)] sm:grid-cols-2">
          <p>Total: R$ 5.999,00</p>
          <p>Pago: R$ 2.520,00</p>
          <p>Restante: R$ 3.479,00</p>
          <p>Próximo aporte sugerido: R$ 500,00</p>
        </div>
        <Button variant="accent" disabled>
          Gerar Pix (TODO)
        </Button>
        <p className="text-xs text-[var(--ink-muted)]">
          TODO: ledger de aportes, status de estoque e liberação para retirada.
        </p>
      </Card>
    </div>
  );
}
