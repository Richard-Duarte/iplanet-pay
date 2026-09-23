import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export type SessionUpdate = {
  response: NextResponse;
  user: User | null;
  supabase: SupabaseClient | null;
};

export async function updateSession(
  request: NextRequest,
): Promise<SessionUpdate> {
  let supabaseResponse = NextResponse.next({ request });

  if (USE_MOCK_AUTH) {
    return { response: supabaseResponse, user: null, supabase: null };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser refreshes the session; do not use getSession here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user, supabase };
}

/** Copy refreshed auth cookies onto a redirect response. */
export function withSessionCookies(
  redirect: NextResponse,
  sessionResponse: NextResponse,
) {
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}
