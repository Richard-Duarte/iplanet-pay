import { listCatalogProducts } from "@/lib/catalog/products";
import { LandingCatalog } from "@/components/landing/landing-catalog";
import { FaqChat } from "@/components/chat/faq-chat";
import { getAppSettings } from "@/lib/settings/queries";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

export default async function LandingPage() {
  const [{ products }, { settings }] = await Promise.all([
    listCatalogProducts(),
    getAppSettings(["whatsapp_support"]),
  ]);

  const landingProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    model: p.model,
    storage: p.storage,
    color: p.color,
    list_price_cents: p.list_price_cents,
    image_url: p.image_url,
    active: p.active,
    category: (p as typeof p & { category?: string }).category,
  }));

  return (
    <>
      <PageViewTracker path="/" />
      <LandingCatalog products={landingProducts as never} />
      <FaqChat whatsappDigits={settings.whatsapp_support} />
    </>
  );
}
