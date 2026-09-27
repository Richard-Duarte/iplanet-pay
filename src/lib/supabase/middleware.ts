import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export type SessionUpdate = {
  response: NextResponse;
  user: User | null;
  supabase: SupabaseClient | null;
};

const SESSION_FETCH_MS = 8_000;

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => {
    const n = c.name;
    return n.startsWith("sb-") && n.includes("auth");
  });
}

/** Avoid hanging the Edge middleware when Supabase is slow (Vercel 504). */
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
  let user: User | null = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth timeout")), SESSION_FETCH_MS),
      ),
    ]);
    user = result.data.user;
  } catch {
    return { response: supabaseResponse, user: null, supabase: null };
  }

  return { response: supabaseResponse, user, supabase };
}

export function shouldRefreshSession(
  pathname: string,
  request: NextRequest,
): boolean {
  if (pathname.startsWith("/auth/callback")) return true;
  if (pathname.startsWith("/app") || pathname.startsWith("/admin")) return true;
  if (pathname === "/entrar" || pathname === "/criar-conta") return true;
  if (pathname.startsWith("/api/")) return hasSupabaseAuthCookie(request);
  return hasSupabaseAuthCookie(request);
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
