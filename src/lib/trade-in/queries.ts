import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { mockGetLatestOfferForReservation } from "@/lib/trade-in/mock";
import type { UsedDeviceOffer, UsedDeviceOfferWithProfile } from "@/lib/trade-in/types";

const OFFER_SELECT = `
  id,
  user_id,
  reservation_id,
  device_model,
  imei,
  expected_value_cents,
  minimum_value_cents,
  maintenance_options,
  liquid_exposure,
  photo_paths,
  status,
  admin_message,
  approved_value_cents,
  reviewed_at,
  created_at
`;

export async function getLatestUsedDeviceOfferForReservation(
  reservationId: string,
  userId: string,
): Promise<{ offer: UsedDeviceOffer | null; error?: string }> {
  if (USE_MOCK_AUTH) {
    return { offer: mockGetLatestOfferForReservation(reservationId, userId) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("used_device_offers")
    .select(OFFER_SELECT)
    .eq("reservation_id", reservationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { offer: null, error: error.message };
  }
  return { offer: (data as UsedDeviceOffer | null) ?? null };
}

export async function listUsedDeviceOffersAdmin(filters: {
  status?: string;
  name?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ rows: UsedDeviceOfferWithProfile[]; error?: string }> {
  const admin = createServiceClient();
  let q = admin
    .from("used_device_offers")
    .select(OFFER_SELECT)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters.dateFrom) {
    q = q.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  }
  if (filters.dateTo) {
    q = q.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }

  const { data, error } = await q;
  if (error) {
    return { rows: [], error: error.message };
  }

  const offers = (data ?? []) as UsedDeviceOffer[];
  const userIds = [...new Set(offers.map((o) => o.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, phone").in("id", userIds)
    : { data: [] as Array<{ id: string; full_name: string | null; phone: string | null }> };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let rows: UsedDeviceOfferWithProfile[] = offers.map((o) => {
    const p = profileMap.get(o.user_id);
    return {
      ...o,
      client_name: p?.full_name ?? null,
      client_phone: p?.phone ?? null,
    };
  });

  if (filters.name?.trim()) {
    const needle = filters.name.trim().toLowerCase();
    rows = rows.filter((r) =>
      (r.client_name ?? "").toLowerCase().includes(needle),
    );
  }

  return { rows };
}

export async function getUsedDeviceOfferByIdAdmin(
  id: string,
): Promise<{ offer: UsedDeviceOfferWithProfile | null; error?: string }> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("used_device_offers")
    .select(OFFER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { offer: null, error: error?.message ?? "Não encontrado" };
  }

  const offer = data as UsedDeviceOffer;
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", offer.user_id)
    .maybeSingle();

  return {
    offer: {
      ...offer,
      client_name: profile?.full_name ?? null,
      client_phone: profile?.phone ?? null,
    },
  };
}
