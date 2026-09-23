import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import {
  mockGetById,
  mockListMine,
  mockListOps,
  mockListQuitadas,
  mockListRecent,
  mockListStores,
} from "@/lib/reservations/mock";
import {
  RESERVATION_DETAIL_SELECT,
  isReservationStatus,
  type ReservationOpsRow,
  type ReservationStatus,
  type ReservationStore,
  type ReservationWithDetails,
} from "@/lib/reservations/types";

export type ListOwnOptions = {
  status?: ReservationStatus | null;
};

export type ListOpsOptions = {
  status?: ReservationStatus | null;
  storeId?: string | null;
  limit?: number;
};

async function attachClients(
  reservations: ReservationWithDetails[],
): Promise<ReservationOpsRow[]> {
  if (reservations.length === 0) return [];

  const userIds = [...new Set(reservations.map((r) => r.user_id))];
  const profileById = new Map<
    string,
    { id: string; full_name: string; phone: string | null }
  >();

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      profileById.set(p.id, p);
    }
  } catch {
    // Parceiro / RLS may block profile reads — still return rows without client.
  }

  return reservations.map((r) => {
    const profile = profileById.get(r.user_id);
    return {
      ...r,
      client: profile
        ? {
            id: profile.id,
            full_name: profile.full_name,
            phone: profile.phone,
            email: null,
          }
        : null,
    };
  });
}

/**
 * Lista reservas do próprio usuário. Filtro opcional por status.
 * Preferir em telas novas; `listMyReservations` permanece como alias.
 */
export async function listOwnReservations(
  userId: string,
  options?: ListOwnOptions,
): Promise<{ reservations: ReservationWithDetails[]; error: string | null }> {
  const status = options?.status ?? null;

  if (USE_MOCK_AUTH) {
    let rows = mockListMine(userId);
    if (status) rows = rows.filter((r) => r.status === status);
    return { reservations: rows, error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    let query = supabase
      .from("reservations")
      .select(RESERVATION_DETAIL_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { reservations: [], error: error.message };
    return {
      reservations: (data ?? []) as unknown as ReservationWithDetails[],
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar reservas";
    return { reservations: [], error: message };
  }
}

/** Alias — home e demais telas existentes. */
export async function listMyReservations(
  userId: string,
): Promise<{ reservations: ReservationWithDetails[]; error: string | null }> {
  return listOwnReservations(userId);
}

export async function getReservationById(
  id: string,
): Promise<{ reservation: ReservationWithDetails | null; error: string | null }> {
  if (USE_MOCK_AUTH) {
    return { reservation: mockGetById(id), error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reservations")
      .select(RESERVATION_DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) return { reservation: null, error: error.message };
    return {
      reservation: (data ?? null) as unknown as ReservationWithDetails | null,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar reserva";
    return { reservation: null, error: message };
  }
}

export async function listRecentReservations(
  limit = 12,
): Promise<{ reservations: ReservationWithDetails[]; error: string | null }> {
  if (USE_MOCK_AUTH) {
    return { reservations: mockListRecent(limit), error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reservations")
      .select(RESERVATION_DETAIL_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { reservations: [], error: error.message };
    return {
      reservations: (data ?? []) as unknown as ReservationWithDetails[],
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar reservas";
    return { reservations: [], error: message };
  }
}

/** Quitadas prontas para retirada (fila ops). */
export async function listQuitadasForPickup(options?: {
  storeId?: string | null;
  limit?: number;
}): Promise<{ reservations: ReservationWithDetails[]; error: string | null }> {
  const limit = options?.limit ?? 24;
  const storeId = options?.storeId ?? null;

  if (USE_MOCK_AUTH) {
    return { reservations: mockListQuitadas(storeId, limit), error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    let query = supabase
      .from("reservations")
      .select(RESERVATION_DETAIL_SELECT)
      .eq("status", "quitada")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (storeId) query = query.eq("store_id", storeId);

    const { data, error } = await query;
    if (error) return { reservations: [], error: error.message };
    return {
      reservations: (data ?? []) as unknown as ReservationWithDetails[],
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar fila de retirada";
    return { reservations: [], error: message };
  }
}

/**
 * Lista ops (staff/admin/parceiro via RLS). Cliente em 2ª query
 * (sem FK reservations→profiles; email não existe em profiles).
 */
export async function listOpsReservations(
  options?: ListOpsOptions,
): Promise<{ reservations: ReservationOpsRow[]; error: string | null }> {
  const status = options?.status ?? null;
  const storeId = options?.storeId ?? null;
  const limit = options?.limit ?? 200;

  if (USE_MOCK_AUTH) {
    return {
      reservations: mockListOps({ status, storeId, limit }),
      error: null,
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    let query = supabase
      .from("reservations")
      .select(RESERVATION_DETAIL_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && isReservationStatus(status)) {
      query = query.eq("status", status);
    }
    if (storeId) query = query.eq("store_id", storeId);

    const { data, error } = await query;
    if (error) return { reservations: [], error: error.message };

    const rows = (data ?? []) as unknown as ReservationWithDetails[];
    return { reservations: await attachClients(rows), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar reservas";
    return { reservations: [], error: message };
  }
}

export async function listStores(): Promise<{
  stores: ReservationStore[];
  error: string | null;
}> {
  if (USE_MOCK_AUTH) {
    return { stores: mockListStores(), error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, city")
      .order("name");

    if (error) return { stores: [], error: error.message };
    return { stores: (data ?? []) as ReservationStore[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar lojas";
    return { stores: [], error: message };
  }
}
