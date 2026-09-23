import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProductCategory } from "@/types/database";

export type CategoryMutationResult =
  | { ok: true; category: ProductCategory }
  | { ok: false; error: string };

const MOCK_CATEGORIES: ProductCategory[] = [
  { id: "cat-iphone", name: "iPhone", slug: "iphone", sort_order: 1, active: true },
  { id: "cat-macbook", name: "MacBook", slug: "macbook", sort_order: 2, active: true },
  { id: "cat-mac", name: "Mac", slug: "mac", sort_order: 3, active: true },
  { id: "cat-airpods", name: "AirPods", slug: "airpods", sort_order: 4, active: true },
  { id: "cat-watch", name: "Watch", slug: "watch", sort_order: 5, active: true },
];

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/** Active categories for landing / public catalog. */
export async function listCategories(): Promise<{
  categories: ProductCategory[];
  error: string | null;
}> {
  if (USE_MOCK_AUTH) {
    return { categories: MOCK_CATEGORIES.filter((c) => c.active), error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, sort_order, active, created_at")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) return { categories: [], error: error.message };
    return { categories: (data ?? []) as ProductCategory[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar categorias";
    return { categories: [], error: message };
  }
}

/** All categories for admin (including inactive). */
export async function listCategoriesAdmin(): Promise<{
  categories: ProductCategory[];
  error: string | null;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { categories: [], error: "Somente admin." };
  }

  if (USE_MOCK_AUTH) {
    return { categories: MOCK_CATEGORIES, error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, sort_order, active, created_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) return { categories: [], error: error.message };
    return { categories: (data ?? []) as ProductCategory[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar categorias";
    return { categories: [], error: message };
  }
}

export async function createCategory(name: string): Promise<CategoryMutationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "admin") {
    return { ok: false, error: "Somente admin pode criar categorias." };
  }

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Informe o nome da categoria." };

  if (USE_MOCK_AUTH) {
    const slug = slugify(trimmed) || "categoria";
    return {
      ok: true,
      category: {
        id: `mock-cat-${slug}`,
        name: trimmed,
        slug,
        sort_order: MOCK_CATEGORIES.length + 1,
        active: true,
      },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: rpcId, error: rpcError } = await supabase.rpc(
      "admin_upsert_category",
      { p_name: trimmed },
    );

    if (rpcError) {
      // Fallback: direct insert if RPC missing
      const slug = slugify(trimmed) || "categoria";
      const { data: existing } = await supabase
        .from("product_categories")
        .select("id, name, slug, sort_order, active, created_at")
        .eq("name", trimmed)
        .maybeSingle();
      if (existing) {
        return { ok: true, category: existing as ProductCategory };
      }
      const { data: maxRow } = await supabase
        .from("product_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const sort_order = (maxRow?.sort_order ?? 0) + 1;
      const { data, error } = await supabase
        .from("product_categories")
        .insert({ name: trimmed, slug, sort_order, active: true })
        .select("id, name, slug, sort_order, active, created_at")
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, category: data as ProductCategory };
    }

    const id = rpcId as string;
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, sort_order, active, created_at")
      .eq("id", id)
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, category: data as ProductCategory };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao criar categoria";
    return { ok: false, error: message };
  }
}

export async function updateCategory(input: {
  id: string;
  name?: string;
  sort_order?: number;
  active?: boolean;
}): Promise<CategoryMutationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "admin") {
    return { ok: false, error: "Somente admin pode editar categorias." };
  }
  if (!input.id) return { ok: false, error: "Categoria inválida." };

  if (USE_MOCK_AUTH) {
    const found = MOCK_CATEGORIES.find((c) => c.id === input.id);
    if (!found) return { ok: false, error: "Categoria não encontrada." };
    return {
      ok: true,
      category: {
        ...found,
        name: input.name?.trim() || found.name,
        sort_order: input.sort_order ?? found.sort_order,
        active: input.active ?? found.active,
      },
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const n = input.name.trim();
      if (!n) return { ok: false, error: "Nome inválido." };
      patch.name = n;
      patch.slug = slugify(n) || "categoria";
    }
    if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
    if (input.active !== undefined) patch.active = input.active;

    const { data, error } = await supabase
      .from("product_categories")
      .update(patch)
      .eq("id", input.id)
      .select("id, name, slug, sort_order, active, created_at")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, category: data as ProductCategory };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao atualizar categoria";
    return { ok: false, error: message };
  }
}
