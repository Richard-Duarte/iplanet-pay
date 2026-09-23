import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";

export type ReferralMutationResult =
  | { ok: true; bonus_amount_cents?: number }
  | { ok: false; error: string };

export async function applyReferralCode(
  code: string,
): Promise<ReferralMutationResult> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Informe um código de indicação." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };

  if (USE_MOCK_AUTH) {
    return { ok: true, bonus_amount_cents: 5000 };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("apply_referral_code", {
      p_code: trimmed,
    });
    if (error) return { ok: false, error: error.message };
    const payload = data as {
      ok?: boolean;
      bonus_amount_cents?: number;
    } | null;
    return {
      ok: true,
      bonus_amount_cents: payload?.bonus_amount_cents,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao aplicar código";
    return { ok: false, error: message };
  }
}
