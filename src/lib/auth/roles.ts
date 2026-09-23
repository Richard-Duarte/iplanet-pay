import type { UserRole } from "@/types/auth";

export const ROLE_HOME: Record<UserRole, string> = {
  cliente: "/app",
  parceiro: "/parceiro",
  staff: "/staff",
  admin: "/admin",
};

export const PROTECTED_PREFIXES = [
  "/app",
  "/parceiro",
  "/staff",
  "/admin",
] as const;

export function roleAllowedForPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/app")) return role === "cliente" || role === "admin";
  if (pathname.startsWith("/parceiro"))
    return role === "parceiro" || role === "admin";
  if (pathname.startsWith("/staff")) return role === "staff" || role === "admin";
  if (pathname.startsWith("/admin")) return role === "admin";
  return true;
}

export function homeForRole(role: UserRole) {
  return ROLE_HOME[role];
}
