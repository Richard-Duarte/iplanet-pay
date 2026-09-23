import { NextResponse } from "next/server";
import { cancelReservation } from "@/lib/reservations/mutations";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    reservation_id?: string;
  };

  const result = await cancelReservation(body.reservation_id ?? "");

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, id: result.id });
}
