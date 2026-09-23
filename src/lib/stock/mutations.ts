import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";

export type StockMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function setStoreStock(input: {
  storeId: string;
  productId: string;
  qty: number;
}): Promise<StockMutationResult> {
  const { storeId, productId, qty } = input;
  if (!storeId || !productId) {
    return { ok: false, error: "Loja e produto são obrigatórios." };
  }
  if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
    return { ok: false, error: "Quantidade deve ser um inteiro ≥ 0." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (!["admin", "staff", "parceiro"].includes(user.role)) {
    return { ok: false, error: "Sem permissão para ajustar estoque." };
  }
  if (user.role === "parceiro") {
    if (!user.store_id) {
      return {
        ok: false,
        error: "Loja não vinculada. Peça ao admin para associar sua conta.",
      };
    }
    if (user.store_id !== storeId) {
      return { ok: false, error: "Você só pode ajustar o estoque da sua loja." };
    }
  }

  if (USE_MOCK_AUTH) {
    return { ok: true, id: `mock-stock-${storeId}-${productId}` };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("set_store_stock", {
      p_store_id: storeId,
      p_product_id: productId,
      p_qty: qty,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: (data as string) ?? `${storeId}:${productId}` };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao ajustar estoque";
    return { ok: false, error: message };
  }
}

export async function setProductActive(input: {
  productId: string;
  active: boolean;
}): Promise<StockMutationResult> {
  const { productId, active } = input;
  if (!productId) return { ok: false, error: "Produto inválido." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "admin") {
    return { ok: false, error: "Somente admin pode ativar/desativar produtos." };
  }

  if (USE_MOCK_AUTH) {
    return { ok: true, id: productId };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .update({ active })
      .eq("id", productId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: productId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao atualizar produto";
    return { ok: false, error: message };
  }
}
