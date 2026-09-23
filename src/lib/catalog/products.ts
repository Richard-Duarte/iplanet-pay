import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import type { ProductWithStock } from "@/types/database";

/** Demo catalog when USE_MOCK_AUTH (mirrors DB seed). */
export const MOCK_CATALOG: ProductWithStock[] = [
  {
    id: "mock-iphone-15",
    name: "iPhone 15",
    slug: "iphone-15-128-azul",
    brand: "Apple",
    model: "iPhone 15",
    storage: "128 GB",
    color: "Azul",
    list_price_cents: 599900,
    image_url: null,
    active: true,
    store_stock: [
      { qty_available: 3, store: { id: "store-itaim", name: "iPlanet Itaim Bibi", slug: "itaim-bibi" } },
      { qty_available: 2, store: { id: "store-sc", name: "iPlanet São Caetano", slug: "sao-caetano" } },
    ],
  },
  {
    id: "mock-iphone-15-pro",
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro-256-titaniobranco",
    brand: "Apple",
    model: "iPhone 15 Pro",
    storage: "256 GB",
    color: "Titânio Branco",
    list_price_cents: 799900,
    image_url: null,
    active: true,
    store_stock: [
      { qty_available: 3, store: { id: "store-itaim", name: "iPlanet Itaim Bibi", slug: "itaim-bibi" } },
      { qty_available: 2, store: { id: "store-sc", name: "iPlanet São Caetano", slug: "sao-caetano" } },
    ],
  },
  {
    id: "mock-iphone-16",
    name: "iPhone 16",
    slug: "iphone-16-128-preto",
    brand: "Apple",
    model: "iPhone 16",
    storage: "128 GB",
    color: "Preto",
    list_price_cents: 749900,
    image_url: null,
    active: true,
    store_stock: [
      { qty_available: 3, store: { id: "store-itaim", name: "iPlanet Itaim Bibi", slug: "itaim-bibi" } },
      { qty_available: 2, store: { id: "store-sc", name: "iPlanet São Caetano", slug: "sao-caetano" } },
    ],
  },
  {
    id: "mock-iphone-16-plus",
    name: "iPhone 16 Plus",
    slug: "iphone-16-plus-128-ultramarino",
    brand: "Apple",
    model: "iPhone 16 Plus",
    storage: "128 GB",
    color: "Ultramarino",
    list_price_cents: 849900,
    image_url: null,
    active: true,
    store_stock: [
      { qty_available: 3, store: { id: "store-itaim", name: "iPlanet Itaim Bibi", slug: "itaim-bibi" } },
      { qty_available: 2, store: { id: "store-sc", name: "iPlanet São Caetano", slug: "sao-caetano" } },
    ],
  },
  {
    id: "mock-iphone-16-pro",
    name: "iPhone 16 Pro",
    slug: "iphone-16-pro-256-titaniunegro",
    brand: "Apple",
    model: "iPhone 16 Pro",
    storage: "256 GB",
    color: "Titânio Negro",
    list_price_cents: 999900,
    image_url: null,
    active: true,
    store_stock: [
      { qty_available: 3, store: { id: "store-itaim", name: "iPlanet Itaim Bibi", slug: "itaim-bibi" } },
      { qty_available: 2, store: { id: "store-sc", name: "iPlanet São Caetano", slug: "sao-caetano" } },
    ],
  },
  {
    id: "mock-iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    slug: "iphone-16-pro-max-256-titaniudadeserto",
    brand: "Apple",
    model: "iPhone 16 Pro Max",
    storage: "256 GB",
    color: "Titânio Deserto",
    list_price_cents: 1199900,
    image_url: null,
    active: true,
    store_stock: [
      { qty_available: 3, store: { id: "store-itaim", name: "iPlanet Itaim Bibi", slug: "itaim-bibi" } },
      { qty_available: 2, store: { id: "store-sc", name: "iPlanet São Caetano", slug: "sao-caetano" } },
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

export function totalStockQty(product: ProductWithStock) {
  return product.store_stock.reduce((sum, row) => sum + (row.qty_available ?? 0), 0);
}

export function stockByStoreLabel(product: ProductWithStock) {
  return product.store_stock
    .filter((row) => row.store && row.qty_available > 0)
    .map((row) => `${row.store!.name.split(" ").slice(-2).join(" ")}: ${row.qty_available}`)
    .join(" · ");
}
