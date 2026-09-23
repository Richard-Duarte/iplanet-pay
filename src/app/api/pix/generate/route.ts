import { NextResponse } from "next/server";
import { generatePixForReservation } from "@/lib/pix/generate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    reservation_id?: string;
    amount_cents?: number;
    /** Aceita reais no form (ex.: 50.00) se amount_cents ausente */
    amount_brl?: number | string;
  };

  let amountCents = body.amount_cents;
  if (amountCents == null && body.amount_brl != null) {
    const brl =
      typeof body.amount_brl === "string"
        ? Number(body.amount_brl.replace(",", "."))
        : Number(body.amount_brl);
    if (Number.isFinite(brl)) amountCents = Math.round(brl * 100);
  }

  const result = await generatePixForReservation({
    reservationId: body.reservation_id ?? "",
    amountCents: amountCents ?? 0,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    contribution_id: result.contribution_id,
    amount_cents: result.amount_cents,
    gateway_configured: result.gateway_configured,
    pix: result.pix,
    error: "error" in result ? result.error : undefined,
  });
}
