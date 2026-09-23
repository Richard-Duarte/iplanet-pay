import { getCurrentUser } from "@/lib/auth/session";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { nextReminderAt, parseReminderDay } from "@/lib/goals/reminder";

export type CreateGoalInput = {
  product_id: string;
  name: string;
  target_date: string;
  /** Dia do mês 1–30; opcional */
  reminder_day?: number | null;
  /** @deprecated use reminder_day — still accepted for draft compat */
  reminder_at?: string | null;
  amount_cents: number;
  installment_cents: number;
  installments_count: number;
  whatsapp_phone?: string | null;
  reservation_id?: string | null;
};

export type CreateGoalResult =
  | { ok: true; goal_id: string }
  | { ok: false; error: string; needsAuth?: boolean };

export async function createPaymentGoal(
  input: CreateGoalInput,
): Promise<CreateGoalResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Entre para salvar a meta.", needsAuth: true };
  }

  if (!input.product_id || !input.name.trim() || !input.target_date) {
    return { ok: false, error: "Preencha nome, produto e data." };
  }
  if (
    !Number.isFinite(input.amount_cents) ||
    input.amount_cents <= 0 ||
    !Number.isFinite(input.installment_cents) ||
    input.installment_cents <= 0 ||
    !Number.isFinite(input.installments_count) ||
    input.installments_count < 1
  ) {
    return { ok: false, error: "Valores da meta inválidos." };
  }

  let reminderDay = parseReminderDay(input.reminder_day ?? null);
  if (reminderDay == null && input.reminder_at) {
    const d = new Date(input.reminder_at);
    if (!Number.isNaN(d.getTime())) {
      const day = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Sao_Paulo",
          day: "numeric",
        }).format(d),
      );
      reminderDay = Math.min(30, Math.max(1, day));
    }
  }

  const reminderAt =
    reminderDay != null ? nextReminderAt(reminderDay).toISOString() : null;

  if (USE_MOCK_AUTH) {
    return { ok: true, goal_id: `mock-goal-${Date.now()}` };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_goals")
      .insert({
        user_id: user.id,
        product_id: input.product_id,
        reservation_id: input.reservation_id ?? null,
        name: input.name.trim(),
        target_date: input.target_date,
        reminder_day: reminderDay,
        reminder_at: reminderAt,
        amount_cents: Math.round(input.amount_cents),
        installment_cents: Math.round(input.installment_cents),
        installments_count: Math.round(input.installments_count),
        whatsapp_phone: input.whatsapp_phone || user.phone || null,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Falha ao salvar meta." };
    }
    return { ok: true, goal_id: data.id as string };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao salvar meta";
    return { ok: false, error: message };
  }
}
