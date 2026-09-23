import { NextResponse } from "next/server";

/**
 * Cron: auto-cancela reservas ativas zeradas sem aporte há 30 dias.
 * GET/POST com Authorization: Bearer $CRON_SECRET
 * Agenda via Vercel cron / Supabase cron / scheduler externo.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "CRON_SECRET não configurado. Defina no .env quando for ativar o auto-cancel.",
      },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) {
    return NextResponse.json(
      { ok: false, error: "Não autorizado." },
      { status: 401 },
    );
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const admin = createServiceClient();
    const { data, error } = await admin.rpc("cancel_stale_zerada_reservations", {
      p_days: 30,
    });
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const cancelled = (data ?? []) as Array<{
      reservation_id: string;
      user_id: string;
      days_since: number;
    }>;

    return NextResponse.json({
      ok: true,
      cancelled: cancelled.length,
      items: cancelled,
      message:
        "Reservas zeradas sem aporte há 30+ dias canceladas (cancel_reason=stale_zerada_30d).",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha no cron de stale reservations";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
