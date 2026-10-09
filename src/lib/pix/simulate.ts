import { getCurrentUser } from "@/lib/auth/session";
import { tryCreateServiceClient } from "@/lib/supabase/admin";

/**
 * Confirma um aporte pending do próprio usuário sem Pix.
 * Atalho de teste da plataforma. Remover quando for para produção.
 */
export async function simulateOwnAportePayment(contributionId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Entre para continuar." };
  if (!contributionId) return { ok: false as const, error: "Aporte inválido." };

  const { createClient } = await import("@/lib/supabase/server");
  const session = await createClient();
  const { data: row, error } = await session
    .from("contributions")
    .select("id, status, user_id")
    .eq("id", contributionId)
    .maybeSingle();

  if (error || !row || row.user_id !== user.id) {
    return { ok: false as const, error: "Este aporte não é da sua conta." };
  }
  if (row.status === "confirmed") {
    return { ok: true as const, already_confirmed: true };
  }
  if (row.status !== "pending") {
    return { ok: false as const, error: "Este aporte não está aguardando pagamento." };
  }

  const admin = tryCreateServiceClient();
  if (!admin) {
    return {
      ok: false as const,
      error: "Não foi possível confirmar o aporte de teste.",
    };
  }

  const { data, error: confirmError } = await admin.rpc("confirm_contribution", {
    p_contribution_id: contributionId,
  });
  if (confirmError) {
    return { ok: false as const, error: confirmError.message };
  }

  const already = Boolean(
    (data as { already_confirmed?: boolean } | null)?.already_confirmed,
  );
  if (!already) {
    try {
      const { notifyAporteConfirmado } = await import("@/lib/email/notify");
      void notifyAporteConfirmado(contributionId);
    } catch {
      /* aviso não bloqueia o teste */
    }
  }

  return { ok: true as const, already_confirmed: already };
}
