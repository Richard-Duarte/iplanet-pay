import { NextResponse } from "next/server";
import { setProductActive } from "@/lib/stock/mutations";

export async function POST(request: Request) {
  let body: { productId?: string; active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const result = await setProductActive({
    productId: body.productId ?? "",
    active: Boolean(body.active),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, id: result.id });
}
