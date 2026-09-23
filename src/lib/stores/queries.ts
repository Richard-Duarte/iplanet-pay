import type { Store } from "@/types/database";

export async function listStores(): Promise<{
  stores: Store[];
  error: string | null;
}> {
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
