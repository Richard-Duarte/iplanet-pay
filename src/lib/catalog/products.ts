import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import type { ProductWithStock } from "@/types/database";

export const MOCK_CATALOG: ProductWithStock[] = [
  {
    id: "mock-iphone-17",
    name: "iPhone 17",
    slug: "iphone-17-256",
    brand: "Apple",
    model: "iPhone 17",
    storage: "256 GB",
    color: "Lavanda",
    list_price_cents: 799900,
    image_url: "/products/iphone-17.png",
    active: true,
    category: "iPhone",
    category_id: "cat-iphone",
    store_stock: [
      { qty_available: 9999, store: { id: "store-itaim", name: "iPlanet Itaim Bibi", slug: "itaim-bibi" } },
      { qty_available: 9999, store: { id: "store-sc", name: "iPlanet São Caetano", slug: "sao-caetano" } },
    ],
  },
];

export async function listCatalogProducts(): Promise<{
  products: ProductWithStock[];
  error: string | null;
}> {
  if (USE_MOCK_AUTH) {
    return { products: MOCK_CATALOG, error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        brand,
        model,
        storage,
        color,
        list_price_cents,
        image_url,
        active,
        category,
        category_id,
        store_stock (
          qty_available,
          store:stores (
            id,
            name,
            slug
          )
        )
      `,
      )
      .eq("active", true)
      .order("list_price_cents", { ascending: true });

    if (error) {
      return { products: [], error: error.message };
    }

    return {
      products: (data ?? []) as unknown as ProductWithStock[],
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao carregar catálogo";
    return { products: [], error: message };
  }
}

export async function getProductBySlug(slug: string) {
  const { products, error } = await listCatalogProducts();
  if (error) return { product: null, error };
  return {
    product: products.find((p) => p.slug === slug) ?? null,
    error: null,
  };
}

/** Store list for picker — infinite stock: any store linked (or all if empty). */
export function storesForProduct(product: ProductWithStock) {
  const rows = product.store_stock.filter((row) => row.store);
  return rows.length > 0
    ? rows
    : [];
}
