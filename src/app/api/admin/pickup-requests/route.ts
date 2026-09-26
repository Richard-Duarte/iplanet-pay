import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["admin", "staff"].includes(user.role)) {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }

  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("pickup_requests")
      .select("id, mode, status, shipping_method, created_at, reservation_id, user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
    const { data: profiles } = userIds.length
      ? await admin.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as Array<{ id: string; full_name: string | null }> };

    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const rows = (data ?? []).map((r) => ({
      ...r,
      profiles: nameMap.get(r.user_id) ?? null,
    }));

    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Falha" },
      { status: 503 },
    );
  }
}
