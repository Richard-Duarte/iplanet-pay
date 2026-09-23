import { NextResponse } from "next/server";
import { broadcastWhatsapp } from "@/lib/whatsapp/admin";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }
  const audience = String(body.audience ?? "clients_phone") as
    | "clients_phone"
    | "active_goals"
    | "paste";
  const result = await broadcastWhatsapp({
    template_id: String(body.template_id ?? ""),
    audience,
    paste_phones: body.paste_phones ? String(body.paste_phones) : "",
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json(result);
}
