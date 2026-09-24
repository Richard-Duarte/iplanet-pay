import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Não autenticado." },
      { status: 401 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const password = String(body.password ?? "");
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "A senha deve ter pelo menos 8 caracteres." },
      { status: 400 },
    );
  }

  if (USE_MOCK_AUTH) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao alterar senha";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
