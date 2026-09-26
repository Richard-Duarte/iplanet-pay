import {
  REFERRAL_SELECT,
  type Referral,
  type ReferralWithReferred,
} from "@/lib/referrals/types";

export async function getMyReferralCode(userId: string): Promise<{
  referral_code: string | null;
  referred_by: string | null;
  error: string | null;
}> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("referral_code, referred_by")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      return { referral_code: null, referred_by: null, error: error.message };
    }
    return {
      referral_code: data?.referral_code ?? null,
      referred_by: data?.referred_by ?? null,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar código";
    return { referral_code: null, referred_by: null, error: message };
  }
}

export async function listMyReferrals(userId: string): Promise<{
  referrals: ReferralWithReferred[];
  error: string | null;
}> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("referrals")
      .select(REFERRAL_SELECT)
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });
    if (error) return { referrals: [], error: error.message };

    const rows = (data ?? []) as Referral[];
    const ids = [...new Set(rows.map((r) => r.referred_id))];
    const nameMap: Record<string, string | null> = {};
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      for (const p of profiles ?? []) {
        nameMap[p.id] = p.full_name;
      }
    }
    return {
      referrals: rows.map((r) => ({
        ...r,
        referred: { full_name: nameMap[r.referred_id] ?? null },
      })),
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar indicações";
    return { referrals: [], error: message };
  }
}

export async function listAllReferrals(limit = 50): Promise<{
  referrals: ReferralWithReferred[];
  error: string | null;
}> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("referrals")
      .select(REFERRAL_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { referrals: [], error: error.message };
    return { referrals: (data ?? []) as Referral[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar indicações";
    return { referrals: [], error: message };
  }
}

export async function getReferralBonusCents(): Promise<number> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "referral_bonus_amount_cents")
      .maybeSingle();
    const n = Number(data?.value ?? 5000);
    return Number.isFinite(n) && n > 0 ? n : 5000;
  } catch {
    return 5000;
  }
}
