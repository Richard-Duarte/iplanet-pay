import { NextResponse } from "next/server";
import { requestWithdrawal } from "@/lib/withdrawals/mutations";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    reservation_id?: string;
    pix_key?: string;
    pix_key_type?: string;
    holder_full_name?: string;
    holder_cpf?: string;
  };

  if (
    !body.reservation_id ||
    !body.pix_key ||
    !body.pix_key_type ||
    !body.holder_full_name ||
    !body.holder_cpf
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "reservation_id, pix_key, pix_key_type, holder_full_name e holder_cpf são obrigatórios.",
      },
      { status: 400 },
    );
  }

  const result = await requestWithdrawal({
    reservation_id: body.reservation_id,
    pix_key: body.pix_key,
    pix_key_type: body.pix_key_type,
    holder_full_name: body.holder_full_name,
    holder_cpf: body.holder_cpf,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, request_id: result.request_id });
}
