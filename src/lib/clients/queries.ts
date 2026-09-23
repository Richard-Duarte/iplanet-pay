import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { MOCK_USERS } from "@/lib/auth/mock";
import type { ReservationStatus, Store } from "@/types/database";
import type { UserRole } from "@/types/auth";

export type ClientListItem = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  store_id: string | null;
  store_name: string | null;
  created_at: string;
  reservation_count: number;
  total_paid_cents: number;
};

export type ClientReservationRow = {
  id: string;
  status: ReservationStatus;
  list_price_cents: number;
  amount_paid_cents: number;
  created_at: string;
  product_name: string | null;
  store_name: string | null;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function asOne<T extends Record<string, unknown>>(
  value: T | T[] | null | undefined,
): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}


export async function searchClients(options?: {
  q?: string | null;
  limit?: number;
}): Promise<{ clients: ClientListItem[]; error: string | null }> {
  const q = (options?.q ?? "").trim();
  const limit = options?.limit ?? 100;

  if (USE_MOCK_AUTH) {
    const clients: ClientListItem[] = Object.values(MOCK_USERS).map((u, i) => ({
      id: u.id,
      full_name: u.full_name,
      phone: u.phone ?? null,
      role: u.role,
      store_id: u.store_id ?? null,
      store_name: u.store_id ? "Mock Store" : null,
      created_at: new Date().toISOString(),
      reservation_count: i === 0 ? 1 : 0,
      total_paid_cents: i === 0 ? 50000 : 0,
    }));
    const filtered = q
      ? clients.filter(
          (c) =>
            norm(c.full_name).includes(norm(q)) ||
            (c.phone ?? "").includes(q.replace(/\D/g, "")) ||
            (c.phone ?? "").includes(q),
        )
      : clients;
    return { clients: filtered.slice(0, limit), error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    let profilesQuery = supabase
      .from("profiles")
      .select(
        "id, full_name, phone, role, store_id, created_at, store:stores ( id, name )",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      // PostgREST or-filter for name/phone
      const safe = q.replace(/[%_,]/g, "");
      profilesQuery = profilesQuery.or(
        `full_name.ilike.%${safe}%,phone.ilike.%${safe}%`,
      );
    }

    const { data: profiles, error } = await profilesQuery;
    if (error) return { clients: [], error: error.message };

    const ids = (profiles ?? []).map((p) => p.id as string);
    const stats = new Map<string, { count: number; paid: number }>();

    if (ids.length > 0) {
      const { data: reservations, error: resErr } = await supabase
        .from("reservations")
        .select("user_id, amount_paid_cents, status")
        .in("user_id", ids);
      if (resErr) return { clients: [], error: resErr.message };
      for (const r of reservations ?? []) {
        const curr = stats.get(r.user_id) ?? { count: 0, paid: 0 };
        curr.count += 1;
        if (r.status !== "cancelada" && r.status !== "trocada") {
          curr.paid += r.amount_paid_cents ?? 0;
        }
        stats.set(r.user_id, curr);
      }
    }

    const clients: ClientListItem[] = (profiles ?? []).map((p) => {
      const store = asOne(
        p.store as { id: string; name: string } | { id: string; name: string }[] | null,
      );
      const st = stats.get(p.id) ?? { count: 0, paid: 0 };
      return {
        id: p.id,
        full_name: p.full_name || "Sem nome",
        phone: p.phone,
        role: p.role as UserRole,
        store_id: p.store_id,
        store_name: store?.name ?? null,
        created_at: p.created_at,
        reservation_count: st.count,
        total_paid_cents: st.paid,
      };
    });

    return { clients, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao buscar clientes";
    return { clients: [], error: message };
  }
}

export async function listClientReservations(
  userId: string,
): Promise<{ reservations: ClientReservationRow[]; error: string | null }> {
  if (!userId) return { reservations: [], error: "Usuário inválido." };

  if (USE_MOCK_AUTH) {
    return { reservations: [], error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        id,
        status,
        list_price_cents,
        amount_paid_cents,
        created_at,
        product:products ( name ),
        store:stores ( name )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return { reservations: [], error: error.message };

    const reservations: ClientReservationRow[] = (data ?? []).map((r) => {
      const product = asOne(
        r.product as { name: string } | { name: string }[] | null,
      );
      const store = asOne(
        r.store as { name: string } | { name: string }[] | null,
      );
      return {
        id: r.id,
        status: r.status as ReservationStatus,
        list_price_cents: r.list_price_cents,
        amount_paid_cents: r.amount_paid_cents,
        created_at: r.created_at,
        product_name: product?.name ?? null,
        store_name: store?.name ?? null,
      };
    });

    return { reservations, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar reservas";
    return { reservations: [], error: message };
  }
}

export async function listStoresForAdmin(): Promise<{
  stores: Store[];
  error: string | null;
}> {
  if (USE_MOCK_AUTH) {
    return {
      stores: [
        {
          id: "store-itaim",
          name: "iPlanet Itaim Bibi",
          slug: "itaim-bibi",
          address: "Itaim Bibi",
          city: "São Paulo",
        },
        {
          id: "store-sc",
          name: "iPlanet São Caetano",
          slug: "sao-caetano",
          address: "Centro",
          city: "São Caetano do Sul",
        },
      ],
      error: null,
    };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("id, name, slug, address, city, created_at")
      .order("name");
    if (error) return { stores: [], error: error.message };
    return { stores: (data ?? []) as Store[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar lojas";
    return { stores: [], error: message };
  }
}
