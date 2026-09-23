import { listCatalogProducts } from "@/lib/catalog/products";
import { listCategories } from "@/lib/catalog/categories";
import { LandingCatalog } from "@/components/landing/landing-catalog";
import { FaqChat } from "@/components/chat/faq-chat";
import { getAppSettings } from "@/lib/settings/queries";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

export default async function LandingPage() {
  const [{ products }, { categories }, { settings }] = await Promise.all([
    listCatalogProducts(),
    listCategories(),
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
    category: p.category,
    category_id: p.category_id,
  }));

  const landingCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <>
      <PageViewTracker path="/" />
      <LandingCatalog
        products={landingProducts as never}
        categories={landingCategories}
      />
      <FaqChat whatsappDigits={settings.whatsapp_support} />
    </>
  );
}
