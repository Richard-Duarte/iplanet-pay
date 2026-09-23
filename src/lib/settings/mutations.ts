import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";

export type SettingsMutationResult =
  | { ok: true }
  | { ok: false; error: string };

const ALLOWED = new Set([
  "referral_bonus_amount_cents",
  "max_referrals_per_user",
  "max_referrals_per_day",
  "min_contribution_threshold_cents",
]);

export async function upsertAppSetting(
  key: string,
  value: string,
): Promise<SettingsMutationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "admin") {
    return { ok: false, error: "Somente admin pode alterar configurações." };
  }
  if (!ALLOWED.has(key)) {
    return { ok: false, error: "Chave não permitida nesta fase." };
  }
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: "Valor deve ser um número inteiro." };
  }

  if (USE_MOCK_AUTH) return { ok: true };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("app_settings").upsert({
      key,
      value: trimmed,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao salvar configuração";
    return { ok: false, error: message };
  }
}
