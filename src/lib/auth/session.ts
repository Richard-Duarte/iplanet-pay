import { cookies } from "next/headers";
import {
  MOCK_COOKIE,
  MOCK_USERS,
  USE_MOCK_AUTH,
  parseMockSession,
} from "@/lib/auth/mock";
import type { AuthUser } from "@/types/auth";

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (USE_MOCK_AUTH) {
    const cookieStore = await cookies();
    return parseMockSession(cookieStore.get(MOCK_COOKIE)?.value);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role, store_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? "Usuário",
    phone: profile?.phone ?? null,
    role: profile?.role ?? "cliente",
    store_id: profile?.store_id ?? null,
  };
}

export { USE_MOCK_AUTH, MOCK_USERS };
