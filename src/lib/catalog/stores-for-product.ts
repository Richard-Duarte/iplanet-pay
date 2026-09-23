import type { ProductWithStock, Store } from "@/types/database";

export type StoreStockRow = {
  qty_available: number;
  store: Pick<Store, "id" | "name" | "slug"> | null;
};

/**
 * Normalize PostgREST embed shape: `store` may arrive as object or single-element array
 * depending on FK metadata / client version.
 */
export function normalizeStoreEmbed(
  store: StoreStockRow["store"] | StoreStockRow["store"][] | null | undefined,
): StoreStockRow["store"] {
  if (!store) return null;
  if (Array.isArray(store)) {
    const first = store[0];
    if (!first || typeof first !== "object") return null;
    if (!("id" in first) || !first.id) return null;
    return first as StoreStockRow["store"];
  }
  if (typeof store !== "object" || !("id" in store) || !store.id) return null;
  return store;
}

/** Store list for picker — client-safe (no server imports). */
export function storesForProduct(
  product: Pick<ProductWithStock, "store_stock"> | null | undefined,
): StoreStockRow[] {
  const raw = product?.store_stock;
  if (!Array.isArray(raw)) return [];

  const rows: StoreStockRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const store = normalizeStoreEmbed(
      (row as { store?: StoreStockRow["store"] | StoreStockRow["store"][] })
        .store,
    );
    if (!store) continue;
    rows.push({
      qty_available: Number((row as { qty_available?: number }).qty_available ?? 0),
      store,
    });
  }
  return rows;
}
