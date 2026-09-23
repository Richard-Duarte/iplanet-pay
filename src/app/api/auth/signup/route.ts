import { NextResponse } from "next/server";
import {
  MOCK_COOKIE,
  MOCK_USERS,
  USE_MOCK_AUTH,
  serializeMockSession,
} from "@/lib/auth/mock";
import { homeForRole } from "@/lib/auth/roles";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    full_name?: string;
    email?: string;
    password?: string;
    phone?: string;
    referral_code?: string;
  };

  if (USE_MOCK_AUTH) {
    const user = {
      ...MOCK_USERS.cliente,
      email: body.email || MOCK_USERS.cliente.email,
      full_name: body.full_name || MOCK_USERS.cliente.full_name,
      phone: body.phone || MOCK_USERS.cliente.phone,
    };
    const response = NextResponse.json({
      ok: true,
      user,
      redirectTo: homeForRole("cliente"),
      mode: "mock",
    });
    response.cookies.set(MOCK_COOKIE, serializeMockSession(user), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: body.email ?? "",
    password: body.password ?? "",
    options: {
      data: {
        full_name: body.full_name,
        phone: body.phone,
      },
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Falha ao criar conta" },
      { status: 400 },
    );
  }

  const ref = (body.referral_code ?? "").trim();
  if (ref && data.session) {
    try {
      await supabase.rpc("apply_referral_code", { p_code: ref });
    } catch {
      // non-fatal: user can apply later in /app/indicacoes
    }
  }

  return NextResponse.json({
    ok: true,
    redirectTo: homeForRole("cliente"),
    mode: "supabase",
  });
}
