import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";

export type ClientMutationResult =
  | { ok: true }
  | { ok: false; error: string };

/** Roles still present in DB enum; UI only assigns cliente|admin. */
const ROLES: UserRole[] = ["cliente", "parceiro", "staff", "admin"];
const ASSIGNABLE: UserRole[] = ["cliente", "admin"];

export function isUserRole(v: string): v is UserRole {
  return (ROLES as string[]).includes(v);
}

export function isAssignableRole(v: string): v is "cliente" | "admin" {
  return (ASSIGNABLE as string[]).includes(v);
}

export async function adminSetUserRole(input: {
  userId: string;
  role: UserRole;
  storeId?: string | null;
}): Promise<ClientMutationResult> {
  const { userId, role, storeId = null } = input;
  if (!userId) return { ok: false, error: "Usuário inválido." };
  if (!isAssignableRole(role)) {
    return {
      ok: false,
      error: "Papel inválido. Use apenas cliente ou admin.",
    };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "admin") {
    return { ok: false, error: "Somente admin pode alterar papéis." };
  }

  if (USE_MOCK_AUTH) {
    return { ok: true };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_user_role", {
      p_user_id: userId,
      p_role: role,
      p_store_id: null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao alterar papel";
    return { ok: false, error: message };
  }
}
