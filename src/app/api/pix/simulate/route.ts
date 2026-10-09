import { NextResponse } from "next/server";
import { simulateOwnAportePayment } from "@/lib/pix/simulate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    contribution_id?: string;
  };
  const result = await simulateOwnAportePayment(body.contribution_id ?? "");
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, already_confirmed: result.already_confirmed });
}
