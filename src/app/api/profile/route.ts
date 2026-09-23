import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Não autenticado." },
      { status: 401 },
    );
  }

  let body: { full_name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const full_name = (body.full_name ?? "").trim();
  const phone = (body.phone ?? "").trim() || null;
  if (!full_name) {
    return NextResponse.json(
      { ok: false, error: "Informe o nome." },
      { status: 400 },
    );
  }

  if (USE_MOCK_AUTH) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name, phone })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao atualizar perfil";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
