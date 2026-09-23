import { getCurrentUser } from "@/lib/auth/session";
import { mapWalletError } from "@/lib/wallet/errors";
import { MIN_CONTRIBUTION_CENTS } from "@/lib/wallet/types";

export type CreateContributionResult =
  | { ok: true; contribution_id: string; amount_cents: number }
  | { ok: false; error: string };

export type ConfirmContributionResult =
  | {
      ok: true;
      already_confirmed?: boolean;
      amount_paid_cents?: number;
      reservation_status?: string;
    }
  | { ok: false; error: string };

export async function createContribution(
  reservationId: string,
  amountCents: number,
): Promise<CreateContributionResult> {
  if (!reservationId) {
    return { ok: false, error: "Reserva inválida." };
  }
  if (!Number.isFinite(amountCents) || amountCents < MIN_CONTRIBUTION_CENTS) {
    return { ok: false, error: "Valor mínimo de R$ 5,00 por aporte." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_contribution", {
      p_reservation_id: reservationId,
      p_amount_cents: Math.round(amountCents),
    });

    if (error || !data) {
      return { ok: false, error: mapWalletError(error?.message) };
    }
    return {
      ok: true,
      contribution_id: data as string,
      amount_cents: Math.round(amountCents),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao criar aporte";
    return { ok: false, error: mapWalletError(message) };
  }
}

export async function adminConfirmContribution(
  contributionId: string,
): Promise<ConfirmContributionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre para continuar." };
  if (user.role !== "staff" && user.role !== "admin") {
    return {
      ok: false,
      error: "Apenas staff/admin podem confirmar aportes manualmente.",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_confirm_contribution", {
      p_contribution_id: contributionId,
    });

    if (error) {
      return { ok: false, error: mapWalletError(error.message) };
    }
    const payload = (data ?? {}) as {
      ok?: boolean;
      already_confirmed?: boolean;
      amount_paid_cents?: number;
      reservation_status?: string;
    };
    if (!payload.already_confirmed) {
      const { notifyAporteConfirmado } = await import("@/lib/email/notify");
      void notifyAporteConfirmado(contributionId);
    }
    return {
      ok: true,
      already_confirmed: payload.already_confirmed,
      amount_paid_cents: payload.amount_paid_cents,
      reservation_status: payload.reservation_status,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao confirmar aporte";
    return { ok: false, error: mapWalletError(message) };
  }
}
