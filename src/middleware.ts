import { NextResponse, type NextRequest } from "next/server";
import {
  MOCK_COOKIE,
  USE_MOCK_AUTH,
  parseMockSession,
} from "@/lib/auth/mock";
import {
  PROTECTED_PREFIXES,
  homeForRole,
  roleAllowedForPath,
} from "@/lib/auth/roles";
import {
  updateSession,
  withSessionCookies,
} from "@/lib/supabase/middleware";
import type { UserRole } from "@/types/auth";

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  search?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (search) {
    for (const [key, value] of Object.entries(search)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Parceiro / staff panels removed — only cliente + admin
  if (pathname.startsWith("/parceiro") || pathname.startsWith("/staff")) {
    return redirectTo(request, "/entrar");
  }

  if (USE_MOCK_AUTH) {
    const user = parseMockSession(request.cookies.get(MOCK_COOKIE)?.value);

    if (isProtected(pathname)) {
      if (!user) {
        return redirectTo(request, "/entrar", { next: pathname });
      }

      if (!roleAllowedForPath(user.role as UserRole, pathname)) {
        return redirectTo(request, homeForRole(user.role as UserRole));
      }
    }

    if (user && (pathname === "/entrar" || pathname === "/criar-conta")) {
      return redirectTo(request, homeForRole(user.role as UserRole));
    }

    return NextResponse.next();
  }

  const { response, user, supabase } = await updateSession(request);

  if (isProtected(pathname)) {
    if (!user || !supabase) {
      return withSessionCookies(
        redirectTo(request, "/entrar", { next: pathname }),
        response,
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile?.role ?? "cliente") as UserRole;

    if (!roleAllowedForPath(role, pathname)) {
      return withSessionCookies(
        redirectTo(request, homeForRole(role)),
        response,
      );
    }
  }

  if (user && supabase && (pathname === "/entrar" || pathname === "/criar-conta")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile?.role ?? "cliente") as UserRole;
    return withSessionCookies(redirectTo(request, homeForRole(role)), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
