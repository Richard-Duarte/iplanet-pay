import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Package, ClipboardCheck } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação"
        title="Staff"
        description="Clientes, estoque e avaliações."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Clientes ativos", value: "—" },
          { label: "Avaliações pendentes", value: "—" },
          { label: "SKUs críticos", value: "—" },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-[var(--ink-muted)]">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      <section id="clientes">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          <Pill>placeholder</Pill>
        </div>
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Lista de clientes"
          description="TODO: busca por perfil, reservas e status KYC leve."
        />
      </section>

      <section id="estoque" className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Estoque</h2>
          <Pill>placeholder</Pill>
        </div>
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Controle de estoque"
          description="TODO: ajustes manuais e conferência por loja."
        />
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
