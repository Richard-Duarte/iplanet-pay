import { createServiceClient } from "@/lib/supabase/admin";
import { enqueueWhatsapp, renderTemplate } from "@/lib/whatsapp/client";

export async function maybeNotifyAdminContributionMilestones(
  reservationId: string,
): Promise<void> {
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return;
  }

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, user_id, list_price_cents, amount_paid_cents, product:products(name)")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation || reservation.list_price_cents <= 0) return;

  const pct = Math.floor(
    (reservation.amount_paid_cents / reservation.list_price_cents) * 100,
  );

  const milestones = [50, 70].filter((m) => pct >= m);
  if (milestones.length === 0) return;

  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["admin_whatsapp_e164"]);

  const adminPhone =
    settings?.find((s) => s.key === "admin_whatsapp_e164")?.value?.trim() ?? "";
  if (!adminPhone) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", reservation.user_id)
    .maybeSingle();

  const productName =
    (reservation.product as { name?: string } | null)?.name ?? "Produto";

  for (const milestone of milestones) {
    const { data: existing } = await supabase
      .from("reservation_milestone_notifications")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("milestone_pct", milestone)
      .maybeSingle();

    if (existing) continue;

    const body = renderTemplate(
      `⚠️ iPlanet Pay: cliente {{nome}} atingiu ${milestone}% do aporte em {{produto}}. Telefone: {{telefone}}.`,
      {
        nome: profile?.full_name ?? "Cliente",
        produto: productName,
        telefone: profile?.phone ?? "—",
      },
    );

    await enqueueWhatsapp({
      to_phone: adminPhone,
      body,
    });

    await supabase.from("reservation_milestone_notifications").insert({
      reservation_id: reservationId,
      milestone_pct: milestone,
    });
  }
}
