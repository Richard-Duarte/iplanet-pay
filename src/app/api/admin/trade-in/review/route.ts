import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !["admin", "staff"].includes(user.role)) {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }

  const body = (await req.json()) as {
    offerId?: string;
    action?: "approve" | "reject";
    adminMessage?: string;
    approvedValueCents?: number;
  };

  const offerId = body.offerId?.trim();
  const action = body.action;
  if (!offerId || !action) {
    return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const admin = createServiceClient();
    const { data, error } = await admin.rpc("review_used_device_offer", {
      p_offer_id: offerId,
      p_action: action,
      p_admin_message: body.adminMessage ?? "",
      p_approved_value_cents: body.approvedValueCents ?? null,
      p_reviewer_id: user.id,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
