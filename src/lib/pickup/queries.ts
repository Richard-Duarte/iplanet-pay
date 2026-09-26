import { createServiceClient } from "@/lib/supabase/admin";

export type PickupRequestRow = {
  id: string;
  mode: "store" | "shipping";
  status: string;
  shipping_method: string | null;
  freight_cents: number;
  insurance_cents: number;
  created_at: string;
};

const PICKUP_STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento do frete",
  ready_pickup: "Pronto para retirada na loja",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export function pickupStatusLabel(status: string): string {
  return PICKUP_STATUS_LABEL[status] ?? status;
}

export async function getLatestPickupRequest(
  reservationId: string,
): Promise<PickupRequestRow | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("pickup_requests")
      .select(
        "id, mode, status, shipping_method, freight_cents, insurance_cents, created_at",
      )
      .eq("reservation_id", reservationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}
