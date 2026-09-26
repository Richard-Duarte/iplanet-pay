import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClosing } from "@/lib/finance/closing";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }

  let body: { period_start?: string; period_end?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!body.period_start || !body.period_end) {
    return NextResponse.json({ ok: false, error: "Informe o período." }, { status: 400 });
  }

  const { closing, error } = await createClosing({
    periodStart: body.period_start,
    periodEnd: body.period_end,
    notes: body.notes,
    adminUserId: user.id,
  });

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, closing });
}
