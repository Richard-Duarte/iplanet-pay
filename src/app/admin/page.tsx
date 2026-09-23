import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CreditCard,
  Store,
  Settings,
  Trophy,
} from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { listRecentContributions } from "@/lib/wallet/queries";
import { ContributionList } from "@/components/wallet/contribution-list";
import { formatCentsBRL } from "@/lib/utils";
import { listQuitadasForPickup } from "@/lib/reservations/queries";
import { PickupQueue } from "@/components/reservations/pickup-queue";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const { contributions } = await listRecentContributions(10);
  const { reservations: quitadas } = await listQuitadasForPickup({ limit: 12 });
  const aporteTotal = contributions
    .filter((c) => c.status === "confirmed")
    .reduce((s, c) => s + c.amount_cents, 0);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Plataforma"
        title="Admin"
        description="Overview financeiro, lojas, gateways, sorteios e config."
        size="xl"
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "GMV (mês)", value: "—" },
          { label: "Aportes Pix", value: formatCentsBRL(aporteTotal) },
          { label: "Reservas ativas", value: "—" },
          { label: "Lojas", value: "2" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white">
            <p className="text-sm text-[var(--ink-muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <section id="reservas">
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Todas as reservas</h2>
            <p className="mt-1 text-[var(--ink-muted)]">
              Busca, filtros por status/loja, cancelar e confirmar retirada.
            </p>
          </div>
          <Link href="/admin/reservas">
            <Button variant="accent">Abrir reservas</Button>
          </Link>
        </Card>
      </section>

      <section id="retiradas">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Prontas para retirada
          </h2>
          <Pill tone="accent">{quitadas.length}</Pill>
        </div>
        <PickupQueue reservations={quitadas} />
      </section>

      <section id="financeiro">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Financeiro</h2>
          <Pill tone="accent">aportes</Pill>
        </div>
        {contributions.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="Sem aportes ainda"
            description="Aportes confirmados e pendentes aparecerão aqui."
          />
        ) : (
          <Card>
            <ContributionList contributions={contributions} />
          </Card>
        )}
      </section>

      <section id="lojas" className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Lojas</h2>
          <Pill tone="lavender">seed</Pill>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <Store className="mb-3 h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-xl font-bold">Itaim Bibi</h3>
            <p className="text-[var(--ink-muted)]">São Paulo · SP</p>
          </Card>
          <Card>
            <Store className="mb-3 h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-xl font-bold">São Caetano</h3>
            <p className="text-[var(--ink-muted)]">São Caetano do Sul · SP</p>
          </Card>
        </div>
      </section>

      <section id="gateways" className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Gateways</h2>
          <Pill>TODO</Pill>
        </div>
        <EmptyState
          icon={<Settings className="h-6 w-6" />}
          title="Configuração de gateways Pix"
          description="TODO: chaves, webhooks e ambiente sandbox/produção."
        />
      </section>

      <section id="sorteios" className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Sorteios</h2>
          <Pill>TODO</Pill>
        </div>
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="Campanhas e sorteios"
          description="TODO: regras, elegibilidade e auditoria."
        />
      </section>

      <section id="config" className="mt-8">
        <Card>
          <h2 className="text-2xl font-bold tracking-tight">Config</h2>
          <p className="mt-2 text-[var(--ink-muted)]">
            TODO: parâmetros globais, papéis e feature flags.
          </p>
        </Card>
      </section>
    </div>
  );
}
