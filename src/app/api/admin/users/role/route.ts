import { NextResponse } from "next/server";
import {
  adminSetUserRole,
  isUserRole,
} from "@/lib/clients/mutations";

export async function POST(request: Request) {
  let body: { userId?: string; role?: string; storeId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const role = body.role ?? "";
  if (!isUserRole(role)) {
    return NextResponse.json(
      { ok: false, error: "Papel inválido." },
      { status: 400 },
    );
  }

  const result = await adminSetUserRole({
    userId: body.userId ?? "",
    role,
    storeId: body.storeId ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
