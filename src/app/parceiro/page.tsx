import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, ShoppingBag } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Parceiro" };

export default function ParceiroPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Loja parceira"
        title="Dashboard"
        description="Estoque e pedidos — esqueleto para integração futura."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Itens em estoque", value: "—" },
          { label: "Pedidos abertos", value: "—" },
          { label: "Retiradas hoje", value: "—" },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-[var(--ink-muted)]">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

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

      <section id="pedidos" className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>
          <Pill tone="lavender">placeholder</Pill>
        </div>
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Sem pedidos nesta fase"
          description="TODO: fila de reservas quitadas prontas para retirada."
        />
      </section>
    </div>
  );
}
