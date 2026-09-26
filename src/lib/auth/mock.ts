import type { AuthUser, UserRole } from "@/types/auth";

export const MOCK_COOKIE = "iplanet_mock_session";
export const USE_MOCK_AUTH =
  process.env.USE_MOCK_AUTH === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const MOCK_USERS: Record<UserRole, AuthUser> = {
  cliente: {
    id: "mock-cliente",
    email: "cliente@iplanet.demo",
    full_name: "Ana Cliente",
    phone: "+55 11 90000-0001",
    role: "cliente",
    store_id: null,
    avatar_url: null,
    pix_key: null,
    pix_key_type: null,
  },
  parceiro: {
    id: "mock-parceiro",
    email: "parceiro@iplanet.demo",
    full_name: "Loja Parceira",
    phone: "+55 11 90000-0002",
    role: "parceiro",
    store_id: "store-itaim",
    avatar_url: null,
    pix_key: null,
    pix_key_type: null,
  },
  staff: {
    id: "mock-staff",
    email: "staff@iplanet.demo",
    full_name: "Carlos Staff",
    phone: "+55 11 90000-0003",
    role: "staff",
    store_id: "store-itaim",
    avatar_url: null,
    pix_key: null,
    pix_key_type: null,
  },
  admin: {
    id: "mock-admin",
    email: "admin@iplanet.demo",
    full_name: "Admin iPlanet",
    phone: "+55 11 90000-0004",
    role: "admin",
    store_id: null,
    avatar_url: null,
    pix_key: null,
    pix_key_type: null,
  },
};

export function parseMockSession(raw: string | undefined | null): AuthUser | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as AuthUser;
    if (!data?.role || !MOCK_USERS[data.role]) return null;
    return { ...MOCK_USERS[data.role], ...data };
  } catch {
    return null;
  }
}

export function serializeMockSession(user: AuthUser) {
  return JSON.stringify(user);
}
