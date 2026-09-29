import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listUsedDeviceOffersAdmin } from "@/lib/trade-in/queries";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !["admin", "staff"].includes(user.role)) {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "all";
  const name = url.searchParams.get("name") ?? "";
  const dateFrom = url.searchParams.get("dateFrom") ?? "";
  const dateTo = url.searchParams.get("dateTo") ?? "";

  try {
    const { rows, error } = await listUsedDeviceOffersAdmin({
      status,
      name,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Falha ao carregar." },
      { status: 500 },
    );
  }
}
