import { NextResponse } from "next/server";
import { notifyAporteReminder } from "@/lib/email/notify";

/**
 * Cron stub: GET/POST with Authorization: Bearer $CRON_SECRET
 * Schedule via Supabase cron / Vercel cron / external when ready.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "CRON_SECRET não configurado. Defina no .env quando for ativar lembretes.",
      },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== secret) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const admin = createServiceClient();
    const { data, error } = await admin.rpc("find_stale_aporte_candidates", {
      p_days: 30,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const { data: settings } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "whatsapp_support")
      .maybeSingle();

    const candidates = (data ?? []) as Array<{
      reservation_id: string;
      email: string;
      full_name: string;
      product_name: string;
      days_since: number;
    }>;

    let sent = 0;
    for (const c of candidates) {
      if (!c.email) continue;
      await notifyAporteReminder({
        ...c,
        whatsapp_digits: settings?.value ?? "",
      });
      sent += 1;
    }

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      queued_or_sent: sent,
      message:
        "Lembretes processados (Resend se chave presente; senão email_outbox).",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha no cron de lembrete";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
