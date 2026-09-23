import { NextResponse } from "next/server";
import { switchReservation } from "@/lib/reservations/mutations";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    product_id?: string;
  };

  const result = await switchReservation(id ?? "", body.product_id ?? "");

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, id: result.id });
}
