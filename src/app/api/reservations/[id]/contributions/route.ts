import { NextResponse } from "next/server";
import { generatePixForReservation } from "@/lib/pix/generate";
import { listContributionsForReservation } from "@/lib/wallet/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { contributions, error } = await listContributionsForReservation(id);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, contributions });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    amount_cents?: number;
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
    reservationId: id,
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
