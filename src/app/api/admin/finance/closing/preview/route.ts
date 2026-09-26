import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { previewClosing } from "@/lib/finance/closing";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ ok: false, error: "Parâmetros start e end." }, { status: 400 });
  }

  const preview = await previewClosing(start, end);
  if (preview.error) {
    return NextResponse.json({ ok: false, error: preview.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, preview });
}
