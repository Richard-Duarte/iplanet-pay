import { NextResponse } from "next/server";
import { adminConfirmContribution } from "@/lib/wallet/mutations";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    contribution_id?: string;
  };
  if (!body.contribution_id) {
    return NextResponse.json(
      { ok: false, error: "contribution_id é obrigatório." },
      { status: 400 },
    );
  }

  const result = await adminConfirmContribution(body.contribution_id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({
    ok: true,
    already_confirmed: result.already_confirmed,
    amount_paid_cents: result.amount_paid_cents,
    reservation_status: result.reservation_status,
  });
}
