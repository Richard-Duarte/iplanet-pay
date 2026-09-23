import { NextResponse } from "next/server";
import { confirmRetirada } from "@/lib/reservations/mutations";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await confirmRetirada(id ?? "");

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, id: result.id });
}
