import {
  CONTRIBUTION_SELECT,
  type Contribution,
} from "@/lib/wallet/types";

export interface FinanceAggregates {
  confirmed_sum_cents: number;
  confirmed_count: number;
  pending_count: number;
  pending_sum_cents: number;
  by_day: Array<{ day: string; confirmed_cents: number; count: number }>;
  by_week: Array<{ week: string; confirmed_cents: number; count: number }>;
  recent: Contribution[];
}

function startOfDayISO(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function startOfWeekISO(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

export async function getFinanceAggregates(limitRecent = 30): Promise<{
  aggregates: FinanceAggregates;
  error: string | null;
}> {
  const empty: FinanceAggregates = {
    confirmed_sum_cents: 0,
    confirmed_count: 0,
    pending_count: 0,
    pending_sum_cents: 0,
    by_day: [],
    by_week: [],
    recent: [],
  };
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const since = new Date();
    since.setDate(since.getDate() - 28);

    const [{ data: recent, error: e1 }, { data: window, error: e2 }] =
      await Promise.all([
        supabase
          .from("contributions")
          .select(CONTRIBUTION_SELECT)
          .order("created_at", { ascending: false })
          .limit(limitRecent),
        supabase
          .from("contributions")
          .select("amount_cents, status, created_at, confirmed_at")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);

    if (e1) return { aggregates: empty, error: e1.message };
    if (e2) return { aggregates: empty, error: e2.message };

    const rows = window ?? [];
    let confirmed_sum_cents = 0;
    let confirmed_count = 0;
    let pending_count = 0;
    let pending_sum_cents = 0;
    const dayMap = new Map<string, { confirmed_cents: number; count: number }>();
    const weekMap = new Map<string, { confirmed_cents: number; count: number }>();

    for (const r of rows) {
      if (r.status === "confirmed") {
        confirmed_sum_cents += r.amount_cents;
        confirmed_count += 1;
        const when = new Date(r.confirmed_at ?? r.created_at);
        const day = startOfDayISO(when);
        const week = startOfWeekISO(when);
        const d = dayMap.get(day) ?? { confirmed_cents: 0, count: 0 };
        d.confirmed_cents += r.amount_cents;
        d.count += 1;
        dayMap.set(day, d);
        const w = weekMap.get(week) ?? { confirmed_cents: 0, count: 0 };
        w.confirmed_cents += r.amount_cents;
        w.count += 1;
        weekMap.set(week, w);
      } else if (r.status === "pending") {
        pending_count += 1;
        pending_sum_cents += r.amount_cents;
      }
    }

    // Also count pending outside window from recent list if needed
    for (const r of recent ?? []) {
      if (r.status === "pending") {
        // already counted if in window; skip duplicates via id check not needed for display totals
      }
    }

    // Full pending/confirmed totals from a lightweight count query when possible
    const [{ count: pendingAll }, { data: confirmedAll }] = await Promise.all([
      supabase
        .from("contributions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("contributions")
        .select("amount_cents")
        .eq("status", "confirmed")
        .limit(5000),
    ]);

    const allConfirmedSum = (confirmedAll ?? []).reduce(
      (s, c) => s + c.amount_cents,
      0,
    );

    return {
      aggregates: {
        confirmed_sum_cents: allConfirmedSum || confirmed_sum_cents,
        confirmed_count: (confirmedAll ?? []).length || confirmed_count,
        pending_count: pendingAll ?? pending_count,
        pending_sum_cents,
        by_day: Array.from(dayMap.entries())
          .map(([day, v]) => ({ day, ...v }))
          .sort((a, b) => b.day.localeCompare(a.day))
          .slice(0, 14),
        by_week: Array.from(weekMap.entries())
          .map(([week, v]) => ({ week, ...v }))
          .sort((a, b) => b.week.localeCompare(a.week))
          .slice(0, 8),
        recent: (recent ?? []) as Contribution[],
      },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar financeiro";
    return { aggregates: empty, error: message };
  }
}
