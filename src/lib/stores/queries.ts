import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import type { Store } from "@/types/database";

const MOCK_STORES: Store[] = [
  {
    id: "store-itaim",
    name: "iPlanet Itaim Bibi",
    slug: "itaim-bibi",
    address: "Itaim Bibi",
    city: "São Paulo",
    created_at: new Date().toISOString(),
  },
  {
    id: "store-scs",
    name: "iPlanet São Caetano",
    slug: "sao-caetano",
    address: "Centro",
    city: "São Caetano do Sul",
    created_at: new Date().toISOString(),
  },
];

export async function listStores(): Promise<{
  stores: Store[];
  error: string | null;
}> {
  if (USE_MOCK_AUTH) {
    return { stores: MOCK_STORES, error: null };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, address, city, created_at")
      .order("name", { ascending: true });
    if (error) return { stores: [], error: error.message };
    return { stores: (data ?? []) as Store[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar lojas";
    return { stores: [], error: message };
  }
}
