import { NextResponse } from "next/server";
import { applyReferralCode } from "@/lib/referrals/mutations";

export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const result = await applyReferralCode(body.code ?? "");
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({
    ok: true,
    bonus_amount_cents: result.bonus_amount_cents,
  });
}
