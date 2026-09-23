import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ReserveForm } from "@/components/reservations/reserve-form";
import { Smartphone } from "lucide-react";
import { formatCentsBRL } from "@/lib/utils";
import {
  listCatalogProducts,
  stockByStoreLabel,
  totalStockQty,
} from "@/lib/catalog/products";

export const metadata = { title: "Catálogo" };

export default async function CatalogoPage() {
  const { products, error } = await listCatalogProducts();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Produtos"
        title="Catálogo"
        description="iPhones disponíveis nas lojas iPlanet — estoque por unidade."
      />

      {error ? (
        <EmptyState
          icon={<Smartphone className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Smartphone className="h-6 w-6" />}
          title="Nenhum produto"
          description="Quando o estoque estiver conectado, os aparelhos aparecerão aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => {
            const qty = totalStockQty(p);
            const stores = stockByStoreLabel(p);
            const subtitle = [p.storage, p.color].filter(Boolean).join(" · ");

            return (
              <Card key={p.id} className="flex flex-col">
                <div className="glow-lavender -mx-6 -mt-6 mb-4 h-36 rounded-t-[var(--radius-card)]" />
                <div className="flex flex-wrap gap-2">
                  <Pill tone="neutral">{p.storage}</Pill>
                  {p.color ? <Pill tone="lavender">{p.color}</Pill> : null}
                  <Pill tone={qty > 0 ? "accent" : "neutral"}>
                    {qty > 0 ? `${qty} em estoque` : "Esgotado"}
                  </Pill>
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight">{p.name}</h3>
                {subtitle ? (
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>
                ) : null}
                <p className="mt-2 text-[var(--accent)] font-semibold">
                  {formatCentsBRL(p.list_price_cents)}
                </p>
                {stores ? (
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">{stores}</p>
                ) : null}
                <div className="mt-auto">
                  <ReserveForm product={p} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
