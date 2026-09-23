import { NextResponse } from "next/server";
import { processWithdrawalAdmin } from "@/lib/withdrawals/mutations";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    requestId?: string;
    action?: "approve" | "reject";
    password?: string;
    adminNotes?: string;
  };

  if (!body.requestId || !body.action || !body.password) {
    return NextResponse.json(
      {
        ok: false,
        error: "requestId, action e password são obrigatórios.",
      },
      { status: 400 },
    );
  }
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json(
      { ok: false, error: "action deve ser approve ou reject." },
      { status: 400 },
    );
  }

  const result = await processWithdrawalAdmin({
    requestId: body.requestId,
    action: body.action,
    password: body.password,
    adminNotes: body.adminNotes,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    payout_status: result.payout_status,
    refund_amount_cents: result.refund_amount_cents,
    reservation_id: result.reservation_id,
  });
}
