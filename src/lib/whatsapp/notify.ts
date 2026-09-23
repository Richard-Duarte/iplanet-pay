import {
  enqueueWhatsapp,
  renderTemplate,
  whatsappConfigured,
} from "./client";
import { formatCentsBRL } from "@/lib/utils";

/**
 * After first confirmed aporte per reservation: enqueue "primeiro_aporte"
 * thank-you + schedule next reminder from active goal if any.
 */
export async function notifyFirstAporteWhatsapp(contributionId: string) {
  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const admin = createServiceClient();

    const { data: contrib } = await admin
      .from("contributions")
      .select("id, user_id, reservation_id, amount_cents, status, confirmed_at")
      .eq("id", contributionId)
      .maybeSingle();

    if (!contrib || contrib.status !== "confirmed") return;

    const { count } = await admin
      .from("contributions")
      .select("id", { count: "exact", head: true })
      .eq("reservation_id", contrib.reservation_id)
      .eq("status", "confirmed");

    // Only first confirmed aporte for this reservation
    if ((count ?? 0) !== 1) return;

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", contrib.user_id)
      .maybeSingle();

    const { data: reservation } = await admin
      .from("reservations")
      .select("product_id, id")
      .eq("id", contrib.reservation_id)
      .maybeSingle();

    if (!reservation) return;

    const { data: product } = await admin
      .from("products")
      .select("name")
      .eq("id", reservation.product_id)
      .maybeSingle();

    const { data: goal } = await admin
      .from("payment_goals")
      .select("*")
      .eq("user_id", contrib.user_id)
      .eq("product_id", reservation.product_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const phone =
      goal?.whatsapp_phone ||
      profile?.phone ||
      "";

    if (!phone) {
      console.info("[whatsapp] primeiro_aporte: sem telefone, skip");
      return;
    }

    const { data: tpl } = await admin
      .from("whatsapp_templates")
      .select("*")
      .eq("name", "primeiro_aporte")
      .eq("active", true)
      .maybeSingle();

    const vars = {
      nome: profile?.full_name?.split(" ")[0] || "olá",
      produto: product?.name || "seu Apple",
      valor: formatCentsBRL(contrib.amount_cents),
      pix: "QR estará disponível quando Pix estiver configurado",
      meta: goal?.name || "sua reserva",
    };

    const body = tpl
      ? renderTemplate(tpl.body, vars)
      : `Oi ${vars.nome}! Seu primeiro aporte de ${vars.valor} para ${vars.produto} foi confirmado.`;

    await enqueueWhatsapp({
      to_phone: phone,
      body,
      template_id: tpl?.id ?? null,
      goal_id: goal?.id ?? null,
    });

    // Schedule next reminder from goal.reminder_at if in the future
    if (goal?.reminder_at && new Date(goal.reminder_at) > new Date()) {
      const { data: cob } = await admin
        .from("whatsapp_templates")
        .select("*")
        .eq("name", "cobranca_lembrete")
        .eq("active", true)
        .maybeSingle();

      const remBody = cob
        ? renderTemplate(cob.body, {
            ...vars,
            valor: formatCentsBRL(goal.installment_cents),
            meta: goal.name,
          })
        : `Lembrete da meta ${goal.name}: aporte sugerido ${formatCentsBRL(goal.installment_cents)}.`;

      await enqueueWhatsapp({
        to_phone: phone,
        body: remBody,
        template_id: cob?.id ?? null,
        goal_id: goal.id,
        scheduled_at: goal.reminder_at,
      });
    }

    console.info("[whatsapp] primeiro_aporte enfileirado", {
      configured: whatsappConfigured(),
      reservation: contrib.reservation_id,
    });
  } catch (err) {
    console.warn("[whatsapp] notifyFirstAporteWhatsapp failed", err);
  }
}
