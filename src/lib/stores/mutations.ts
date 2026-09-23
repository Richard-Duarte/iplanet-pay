import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";
import type { Store } from "@/types/database";

export type StoreMutationResult =
  | { ok: true; store?: Store }
  | { ok: false; error: string };

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function upsertStore(input: {
  id?: string;
  name: string;
  slug?: string;
  address: string;
  city: string;
}): Promise<StoreMutationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "admin") {
    return { ok: false, error: "Somente admin pode gerenciar lojas." };
  }

  const name = input.name.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  if (!name || !address || !city) {
    return { ok: false, error: "Preencha nome, endereço e cidade." };
  }
  const slug = (input.slug?.trim() || slugify(name)) || "loja";

  if (USE_MOCK_AUTH) {
    return {
      ok: true,
      store: {
        id: input.id ?? "mock",
        name,
        slug,
        address,
        city,
      },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (input.id) {
      const { data, error } = await supabase
        .from("stores")
        .update({ name, slug, address, city })
        .eq("id", input.id)
        .select("id, name, slug, address, city, created_at")
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, store: data as Store };
    }
    const { data, error } = await supabase
      .from("stores")
      .insert({ name, slug, address, city })
      .select("id, name, slug, address, city, created_at")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, store: data as Store };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao salvar loja";
    return { ok: false, error: message };
  }
}

export async function deleteStore(id: string): Promise<StoreMutationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "admin") {
    return { ok: false, error: "Somente admin pode gerenciar lojas." };
  }
  if (!id) return { ok: false, error: "Loja inválida." };
  if (USE_MOCK_AUTH) return { ok: true };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao excluir loja";
    return { ok: false, error: message };
  }
}
