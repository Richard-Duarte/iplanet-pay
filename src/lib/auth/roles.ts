import type { UserRole } from "@/types/auth";

/** UI-facing homes. Legacy parceiro/staff roles redirect to login. */
export const ROLE_HOME: Record<UserRole, string> = {
  cliente: "/app",
  parceiro: "/entrar",
  staff: "/entrar",
  admin: "/admin",
};

export const PROTECTED_PREFIXES = [
  "/app",
  "/parceiro",
  "/staff",
  "/admin",
] as const;

export function roleAllowedForPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/parceiro") || pathname.startsWith("/staff")) {
    return false; // layouts/middleware redirect to /entrar
  }
  if (pathname.startsWith("/app")) return role === "cliente" || role === "admin";
  if (pathname.startsWith("/admin")) return role === "admin";
  return true;
}

export function homeForRole(role: UserRole) {
  return ROLE_HOME[role];
}

/** Roles assignable in admin UI */
export const ASSIGNABLE_ROLES: Array<"cliente" | "admin"> = ["cliente", "admin"];
