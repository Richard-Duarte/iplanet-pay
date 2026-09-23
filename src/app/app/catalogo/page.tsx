import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Smartphone } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/utils";

const PLACEHOLDER_PRODUCTS = [
  { id: "1", name: "iPhone 16 Pro", storage: "256 GB", price: 9999 },
  { id: "2", name: "iPhone 16", storage: "128 GB", price: 7499 },
  { id: "3", name: "iPhone 15", storage: "128 GB", price: 5999 },
];

export const metadata = { title: "Catálogo" };

export default function CatalogoPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Produtos"
        title="Catálogo"
        description="Lista placeholder — estoque real virá do Supabase."
      />

      {PLACEHOLDER_PRODUCTS.length === 0 ? (
        <EmptyState
          icon={<Smartphone className="h-6 w-6" />}
          title="Nenhum produto"
          description="Quando o estoque estiver conectado, os aparelhos aparecerão aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {PLACEHOLDER_PRODUCTS.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="glow-lavender -mx-6 -mt-6 mb-4 h-36 rounded-t-[var(--radius-card)]" />
              <Pill tone="neutral">{p.storage}</Pill>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">{p.name}</h3>
              <p className="mt-1 text-[var(--accent)] font-semibold">
                {formatCurrencyBRL(p.price)}
              </p>
              <Button className="mt-5" variant="outline" disabled>
                Reservar (em breve)
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
