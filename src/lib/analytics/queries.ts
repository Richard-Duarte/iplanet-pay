import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export interface AnalyticsSummary {
  page_views: number;
  product_clicks: number;
  contribution_starts: number;
  signups: number;
  top_clicked: Array<{ product_id: string | null; name: string; count: number }>;
  top_aporte_products: Array<{ product_id: string | null; name: string; count: number }>;
  new_users: number;
  events_by_day: Array<{ day: string; count: number; event_type: string }>;
  seo_placeholder: { performance: number; accessibility: number; seo: number };
}

export async function getAnalyticsSummary(opts?: {
  days?: number;
}): Promise<{ summary: AnalyticsSummary; error: string | null }> {
  const days = opts?.days ?? 30;
  const empty: AnalyticsSummary = {
    page_views: 0,
    product_clicks: 0,
    contribution_starts: 0,
    signups: 0,
    top_clicked: [],
    top_aporte_products: [],
    new_users: 0,
    events_by_day: [],
    seo_placeholder: { performance: 92, accessibility: 96, seo: 88 },
  };

  if (USE_MOCK_AUTH) {
    return { summary: empty, error: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("id, event_type, product_id, created_at, meta")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) return { summary: empty, error: error.message };

    const rows = events ?? [];
    const countType = (t: string) => rows.filter((r) => r.event_type === t).length;

    const clickMap = new Map<string, number>();
    for (const r of rows.filter((x) => x.event_type === "product_click" && x.product_id)) {
      clickMap.set(r.product_id!, (clickMap.get(r.product_id!) ?? 0) + 1);
    }

    const { data: products } = await supabase
      .from("products")
      .select("id, name");
    const nameById = new Map((products ?? []).map((p) => [p.id, p.name]));

    const top_clicked = [...clickMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product_id, count]) => ({
        product_id,
        name: nameById.get(product_id) ?? product_id.slice(0, 8),
        count,
      }));

    // aportes by product via contributions join reservations
    const { data: contribs } = await supabase
      .from("contributions")
      .select("id, reservation_id, created_at, reservations(product_id)")
      .eq("status", "confirmed")
      .gte("created_at", since.toISOString());

    const aporteMap = new Map<string, number>();
    for (const c of contribs ?? []) {
      const pid = (c as { reservations?: { product_id?: string } | null }).reservations?.product_id;
      if (!pid) continue;
      aporteMap.set(pid, (aporteMap.get(pid) ?? 0) + 1);
    }
    const top_aporte_products = [...aporteMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product_id, count]) => ({
        product_id,
        name: nameById.get(product_id) ?? product_id.slice(0, 8),
        count,
      }));

    const { count: new_users } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString());

    const dayMap = new Map<string, number>();
    for (const r of rows) {
      const day = r.created_at.slice(0, 10);
      const key = `${day}|${r.event_type}`;
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
    const events_by_day = [...dayMap.entries()].map(([key, count]) => {
      const [day, event_type] = key.split("|");
      return { day, event_type, count };
    });

    return {
      summary: {
        page_views: countType("page_view"),
        product_clicks: countType("product_click"),
        contribution_starts: countType("contribution_start"),
        signups: countType("signup"),
        top_clicked,
        top_aporte_products,
        new_users: new_users ?? 0,
        events_by_day,
        seo_placeholder: empty.seo_placeholder,
      },
      error: null,
    };
  } catch (err) {
    return {
      summary: empty,
      error: err instanceof Error ? err.message : "Falha analytics",
    };
  }
}
