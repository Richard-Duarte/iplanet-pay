import { NextResponse } from "next/server";
import { setStoreStock } from "@/lib/stock/mutations";

export async function POST(request: Request) {
  let body: { storeId?: string; productId?: string; qty?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const result = await setStoreStock({
    storeId: body.storeId ?? "",
    productId: body.productId ?? "",
    qty: Number(body.qty),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, id: result.id });
}
