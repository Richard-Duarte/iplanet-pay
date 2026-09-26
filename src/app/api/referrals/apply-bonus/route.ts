import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }

  let body: { reservation_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const reservationId = body.reservation_id?.trim();
  if (!reservationId) {
    return NextResponse.json({ ok: false, error: "Informe a reserva." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_referral_bonus_to_reservation", {
    p_reservation_id: reservationId,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}
