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
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRole } from "@/types/auth";

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (USE_MOCK_AUTH) {
    const user = parseMockSession(request.cookies.get(MOCK_COOKIE)?.value);

    if (isProtected(pathname)) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/entrar";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }

      if (!roleAllowedForPath(user.role as UserRole, pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = homeForRole(user.role as UserRole);
        return NextResponse.redirect(url);
      }
    }

    if (user && (pathname === "/entrar" || pathname === "/criar-conta")) {
      const url = request.nextUrl.clone();
      url.pathname = homeForRole(user.role as UserRole);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  const response = await updateSession(request);

  // Proteção real: lê cookie de sessão via getUser no updateSession;
  // aqui validamos presença mínima e papel via header interno opcional.
  // Para RLS skeleton, redirecionamos não autenticados nas rotas protegidas.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token") || c.name.startsWith("sb-"));

  if (isProtected(pathname) && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
