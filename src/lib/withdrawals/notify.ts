import { sendEmail } from "@/lib/email/send";
import { withdrawalApprovedEmail } from "@/lib/email/templates/withdrawal-approved";
import { enqueueWhatsapp } from "@/lib/whatsapp/client";
import { formatCentsBRL } from "@/lib/utils";
import { PAYOUT_STATUS_LABEL, type WithdrawalPayoutStatus } from "./types";

/**
 * After admin approves a withdrawal: email + WhatsApp to admin (queue when not configured).
 */
export async function notifyWithdrawalApproved(requestId: string) {
  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const admin = createServiceClient();

    const { data: req } = await admin
      .from("withdrawal_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (!req) return;

    const [{ data: profile }, { data: reservation }, { data: settings }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("full_name")
          .eq("id", req.user_id)
          .maybeSingle(),
        admin
          .from("reservations")
          .select("id, product_id, products(name)")
          .eq("id", req.reservation_id)
          .maybeSingle(),
        admin
          .from("app_settings")
          .select("key, value")
          .in("key", ["whatsapp_support", "admin_notify_email", "whatsapp_admin"]),
      ]);

    const settingsMap = new Map(
      (settings ?? []).map((s: { key: string; value: string }) => [
        s.key,
        s.value,
      ]),
    );

    const prodRaw = reservation?.products as
      | { name?: string }
      | { name?: string }[]
      | null
      | undefined;
    const productName = (
      Array.isArray(prodRaw) ? prodRaw[0]?.name : prodRaw?.name
    ) || "produto";

    const clientName = profile?.full_name || "Cliente";
    const payoutLabel =
      PAYOUT_STATUS_LABEL[req.payout_status as WithdrawalPayoutStatus] ??
      req.payout_status;

    const adminEmail =
      settingsMap.get("admin_notify_email")?.trim() ||
      process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
      "admin@iplanet.com.br";

    const mail = withdrawalApprovedEmail({
      clientName,
      productName,
      refundCents: req.refund_amount_cents,
      feeCents: req.fee_amount_cents,
      totalCents: req.total_paid_cents,
      pixKey: req.pix_key,
      payoutStatus: payoutLabel,
      requestId: req.id,
    });

    await sendEmail({
      to: adminEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      template: "withdrawal_approved",
      payload: { request_id: requestId },
    });

    const waPhone =
      settingsMap.get("whatsapp_admin")?.trim() ||
      settingsMap.get("whatsapp_support")?.trim() ||
      "";

    if (waPhone) {
      const body = [
        `✅ Saque aprovado`,
        `Cliente: ${clientName}`,
        `Produto: ${productName}`,
        `Reembolso: ${formatCentsBRL(req.refund_amount_cents)}`,
        `Pix: ${req.pix_key}`,
        `Payout: ${payoutLabel}`,
        `O agente fará o acompanhamento.`,
      ].join("\n");

      await enqueueWhatsapp({
        to_phone: waPhone,
        body,
      });
    } else {
      console.info(
        "[whatsapp] withdrawal_approved: sem whatsapp_support/admin, skip",
      );
    }
  } catch (err) {
    console.error("[notifyWithdrawalApproved]", err);
  }
}
