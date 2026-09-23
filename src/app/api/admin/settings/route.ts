import { NextResponse } from "next/server";
import { upsertAppSetting } from "@/lib/settings/mutations";

export async function POST(request: Request) {
  let body: { key?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }
  const result = await upsertAppSetting(body.key ?? "", body.value ?? "");
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
