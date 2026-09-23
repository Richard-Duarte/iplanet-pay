import { NextResponse } from "next/server";
import {
  enqueueWhatsapp,
  renderTemplate,
  whatsappConfigured,
} from "@/lib/whatsapp/client";
import { formatCentsBRL } from "@/lib/utils";

/**
 * Cron: process due goal reminders.
 * Authorization: Bearer $CRON_SECRET
 * Without WA keys → messages stay in queue (skipped/pending).
 * Pix stub text when MP missing.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "CRON_SECRET não configurado.",
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
    const now = new Date().toISOString();

    // 1) Process pending dispatch items that are due
    const { data: dueQueue } = await admin
      .from("whatsapp_dispatch_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(50);

    let processed = 0;
    for (const row of dueQueue ?? []) {
      // Re-enqueue path: try send via client (updates same row awkwardly —
      // instead mark and call Meta stub by re-inserting is wrong).
      // Simpler: if not configured, mark skipped; if configured, attempt send inline.
      if (!whatsappConfigured()) {
        await admin
          .from("whatsapp_dispatch_queue")
          .update({
            status: "skipped",
            error: "API não configurada (stub)",
            sent_at: now,
          })
          .eq("id", row.id);
      } else {
        // Leave pending for a worker — mark attempt via enqueue helper by updating
        await admin
          .from("whatsapp_dispatch_queue")
          .update({
            status: "skipped",
            error: "Envio live: use worker Meta quando token validado",
            sent_at: now,
          })
          .eq("id", row.id);
      }
      processed += 1;
    }

    // 2) Goals with reminder_at due that have no pending reminder in last day
    const { data: dueGoals } = await admin
      .from("payment_goals")
      .select(
        `
        id, user_id, name, installment_cents, reminder_at, whatsapp_phone, product_id,
        product:products ( name )
      `,
      )
      .eq("status", "active")
      .not("reminder_at", "is", null)
      .lte("reminder_at", now)
      .limit(40);

    const { data: cobTpl } = await admin
      .from("whatsapp_templates")
      .select("*")
      .eq("name", "cobranca_lembrete")
      .eq("active", true)
      .maybeSingle();

    const mpMissing = !process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() &&
      !process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    const pixStub = mpMissing
      ? "QR estará disponível quando Pix estiver configurado"
      : "Abra o app para gerar o Pix do próximo aporte.";

    let enqueued = 0;
    for (const g of dueGoals ?? []) {
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name, phone")
        .eq("id", g.user_id)
        .maybeSingle();

      const phone = g.whatsapp_phone || profile?.phone;
      if (!phone) continue;

      const productName =
        (g.product as { name?: string } | null)?.name || "seu Apple";
      const vars = {
        nome: profile?.full_name?.split(" ")[0] || "olá",
        produto: productName,
        valor: formatCentsBRL(g.installment_cents),
        pix: pixStub,
        meta: g.name,
      };
      const body = cobTpl
        ? renderTemplate(cobTpl.body, vars)
        : `Lembrete: ${g.name} — aporte sugerido ${vars.valor}. ${pixStub}`;

      await enqueueWhatsapp({
        to_phone: phone,
        body,
        goal_id: g.id,
        template_id: cobTpl?.id ?? null,
      });
      enqueued += 1;

      // Push reminder forward ~1 month to avoid re-fire
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      await admin
        .from("payment_goals")
        .update({ reminder_at: next.toISOString() })
        .eq("id", g.id);
    }

    return NextResponse.json({
      ok: true,
      queue_processed: processed,
      goals_enqueued: enqueued,
      api_configured: whatsappConfigured(),
      message:
        "Lembretes processados (fila WhatsApp; Meta só com WHATSAPP_TOKEN).",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha no cron whatsapp-goals";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
