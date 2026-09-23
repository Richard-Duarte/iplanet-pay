import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ReserveForm } from "@/components/reservations/reserve-form";
import { Smartphone } from "lucide-react";
import { formatCentsBRL } from "@/lib/utils";
import { listCatalogProducts } from "@/lib/catalog/products";
import { FaqChat } from "@/components/chat/faq-chat";
import { getAppSettings } from "@/lib/settings/queries";

export const metadata = { title: "Catálogo" };

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams?: Promise<{ product?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const [{ products, error }, { settings }] = await Promise.all([
    listCatalogProducts(),
    getAppSettings(["whatsapp_support"]),
  ]);

  const highlight = sp.product
    ? products.find((p) => p.slug === sp.product)
    : null;
  const ordered = highlight
    ? [highlight, ...products.filter((p) => p.id !== highlight.id)]
    : products;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Produtos"
        title="Catálogo"
        description="Escolha o aparelho e a loja de retirada. Estoque sempre disponível."
        backFallback="/app"
      />

      {error ? (
        <EmptyState
          icon={<Smartphone className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<Smartphone className="h-6 w-6" />}
          title="Nenhum produto"
          description="Em breve novos aparelhos no catálogo."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ordered.map((p) => {
            const subtitle = [p.storage, p.color].filter(Boolean).join(" · ");
            return (
              <Card
                key={p.id}
                className={`flex flex-col ${highlight?.id === p.id ? "ring-2 ring-[var(--accent)]" : ""}`}
                id={p.slug}
              >
                <div className="relative -mx-6 -mt-6 mb-4 flex h-44 items-center justify-center overflow-hidden rounded-t-[var(--radius-card)] bg-[var(--bg-subtle)]">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={220}
                      height={220}
                      className="h-full w-auto object-contain p-4"
                    />
                  ) : (
                    <div className="glow-lavender absolute inset-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.category ? <Pill tone="accent">{p.category}</Pill> : null}
                  <Pill tone="neutral">{p.storage}</Pill>
                  {p.color ? <Pill tone="lavender">{p.color}</Pill> : null}
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight">{p.name}</h3>
                {subtitle ? (
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>
                ) : null}
                <p className="mt-2 font-semibold text-[var(--accent)]">
                  {formatCentsBRL(p.list_price_cents)}
                </p>
                <div className="mt-auto">
                  <ReserveForm product={p} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <FaqChat whatsappDigits={settings.whatsapp_support} />
    </div>
  );
}
