import { NextResponse } from "next/server";
import { MOCK_COOKIE, USE_MOCK_AUTH } from "@/lib/auth/mock";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  if (USE_MOCK_AUTH) {
    response.cookies.set(MOCK_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  return response;
}
