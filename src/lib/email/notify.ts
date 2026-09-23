import { sendEmail } from "./send";
import { aporteConfirmadoEmail } from "./templates/aporte-confirmado";
import { welcomePostSignupEmail } from "./templates/confirm-account";
import { aporteReminderEmail } from "./templates/aporte-reminder";
import { appBaseUrl } from "./layout";

async function getAdminOrUserClient() {
  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    return createServiceClient();
  } catch {
    const { createClient } = await import("@/lib/supabase/server");
    return createClient();
  }
}

/** After contribution confirmed — fire-and-forget safe. */
export async function notifyAporteConfirmado(contributionId: string) {
  try {
    const supabase = await getAdminOrUserClient();

    const { data: contrib } = await supabase
      .from("contributions")
      .select(
        `
        id,
        amount_cents,
        user_id,
        reservation_id,
        reservations (
          id,
          amount_paid_cents,
          list_price_cents,
          products ( name )
        )
      `,
      )
      .eq("id", contributionId)
      .maybeSingle();

    if (!contrib) return;

    const reservation = contrib.reservations as unknown as {
      id: string;
      amount_paid_cents: number;
      list_price_cents: number;
      products: { name: string } | null;
    } | null;

    let email: string | null = null;
    let fullName = "";

    try {
      const { createServiceClient } = await import("@/lib/supabase/admin");
      const admin = createServiceClient();
      const { data: userData } = await admin.auth.admin.getUserById(contrib.user_id);
      email = userData.user?.email ?? null;
      fullName =
        (userData.user?.user_metadata?.full_name as string | undefined) ?? "";
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", contrib.user_id)
        .maybeSingle();
      if (profile?.full_name) fullName = profile.full_name;
    } catch {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", contrib.user_id)
        .maybeSingle();
      fullName = profile?.full_name ?? "";
    }

    if (!email) {
      console.info("[email] aporte confirmado sem e-mail do usuário", contributionId);
      return;
    }

    const tpl = aporteConfirmadoEmail({
      fullName,
      amountCents: contrib.amount_cents,
      productName: reservation?.products?.name ?? "seu aparelho",
      paidCents: reservation?.amount_paid_cents ?? contrib.amount_cents,
      listPriceCents: reservation?.list_price_cents ?? contrib.amount_cents,
      reservationId: contrib.reservation_id,
    });

    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "aporte_confirmado",
      payload: { contribution_id: contributionId },
    });
  } catch (err) {
    console.warn("[email] notifyAporteConfirmado failed", err);
  }
}

export async function notifyWelcome(opts: {
  email: string;
  fullName?: string;
}) {
  try {
    const tpl = welcomePostSignupEmail({ fullName: opts.fullName });
    await sendEmail({
      to: opts.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "welcome",
    });
  } catch (err) {
    console.warn("[email] notifyWelcome failed", err);
  }
}

export async function notifyAporteReminder(candidate: {
  email: string;
  full_name: string;
  product_name: string;
  days_since: number;
  reservation_id: string;
  whatsapp_digits?: string;
}) {
  const digits = (candidate.whatsapp_digits ?? "").replace(/\D/g, "");
  const whatsappUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent("Olá! Preciso de ajuda com minha reserva iPlanet Pay.")}`
    : null;
  const tpl = aporteReminderEmail({
    fullName: candidate.full_name,
    productName: candidate.product_name,
    daysSince: candidate.days_since,
    reservationId: candidate.reservation_id,
    whatsappUrl,
  });
  return sendEmail({
    to: candidate.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    template: "aporte_reminder",
    payload: {
      reservation_id: candidate.reservation_id,
      app: appBaseUrl(),
    },
  });
}
