import { NextResponse } from "next/server";
import {
  MOCK_COOKIE,
  MOCK_USERS,
  USE_MOCK_AUTH,
  serializeMockSession,
} from "@/lib/auth/mock";
import type { UserRole } from "@/types/auth";
import { homeForRole } from "@/lib/auth/roles";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    role?: UserRole;
  };

  if (USE_MOCK_AUTH) {
    const role = (body.role ?? "cliente") as UserRole;
    const user = MOCK_USERS[role] ?? MOCK_USERS.cliente;
    const response = NextResponse.json({
      ok: true,
      user,
      redirectTo: homeForRole(user.role),
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email ?? "",
    password: body.password ?? "",
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Falha ao entrar" },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = (profile?.role ?? "cliente") as UserRole;

  return NextResponse.json({
    ok: true,
    redirectTo: homeForRole(role),
    mode: "supabase",
  });
}
