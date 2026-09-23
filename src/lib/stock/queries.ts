import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { MOCK_CATALOG } from "@/lib/catalog/products";
import type { Product, Store, StoreStock } from "@/types/database";

export type StockMatrixRow = {
  product: Product;
  byStore: Record<string, number>;
};

export type StockMatrix = {
  stores: Store[];
  rows: StockMatrixRow[];
  error: string | null;
};

function mockMatrix(storeId?: string | null): StockMatrix {
  const storeMap = new Map<string, Store>();
  for (const p of MOCK_CATALOG) {
    for (const s of p.store_stock) {
      if (s.store) {
        storeMap.set(s.store.id, {
          id: s.store.id,
          name: s.store.name,
          slug: s.store.slug,
          address: "",
          city: "",
        });
      }
    }
  }
  let stores = [...storeMap.values()];
  if (storeId) {
    stores = stores.filter((s) => s.id === storeId);
  }
  const rows: StockMatrixRow[] = MOCK_CATALOG.map((p) => {
    const byStore: Record<string, number> = {};
    for (const s of stores) byStore[s.id] = 0;
    for (const row of p.store_stock) {
      if (row.store && (!storeId || row.store.id === storeId)) {
        byStore[row.store.id] = row.qty_available;
      }
    }
    const { store_stock: _, ...product } = p;
    return { product, byStore };
  });
  return { stores, rows, error: null };
}

/**
 * Products × stores with qty_available (0 if no store_stock row).
 * When storeId is set, only that store column is returned (parceiro scope).
 */
export async function listStockMatrix(options?: {
  storeId?: string | null;
  includeInactive?: boolean;
}): Promise<StockMatrix> {
  const storeId = options?.storeId ?? null;
  const includeInactive = options?.includeInactive ?? true;

  if (USE_MOCK_AUTH) {
    return mockMatrix(storeId);
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let storesQuery = supabase
      .from("stores")
      .select("id, name, slug, address, city, created_at")
      .order("name");
    if (storeId) {
      storesQuery = storesQuery.eq("id", storeId);
    }

    let productsQuery = supabase
      .from("products")
      .select(
        "id, name, slug, brand, model, storage, color, list_price_cents, image_url, active, created_at",
      )
      .order("list_price_cents", { ascending: true });
    if (!includeInactive) {
      productsQuery = productsQuery.eq("active", true);
    }

    const [storesRes, productsRes, stockRes] = await Promise.all([
      storesQuery,
      productsQuery,
      storeId
        ? supabase
            .from("store_stock")
            .select("id, store_id, product_id, qty_available")
            .eq("store_id", storeId)
        : supabase
            .from("store_stock")
            .select("id, store_id, product_id, qty_available"),
    ]);

    if (storesRes.error) {
      return { stores: [], rows: [], error: storesRes.error.message };
    }
    if (productsRes.error) {
      return { stores: [], rows: [], error: productsRes.error.message };
    }
    if (stockRes.error) {
      return { stores: [], rows: [], error: stockRes.error.message };
    }

    const stores = (storesRes.data ?? []) as Store[];
    const products = (productsRes.data ?? []) as Product[];
    const stock = (stockRes.data ?? []) as StoreStock[];

    const qtyMap = new Map<string, number>();
    for (const row of stock) {
      qtyMap.set(`${row.store_id}:${row.product_id}`, row.qty_available);
    }

    const rows: StockMatrixRow[] = products.map((product) => {
      const byStore: Record<string, number> = {};
      for (const s of stores) {
        byStore[s.id] = qtyMap.get(`${s.id}:${product.id}`) ?? 0;
      }
      return { product, byStore };
    });

    return { stores, rows, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar estoque";
    return { stores: [], rows: [], error: message };
  }
}
