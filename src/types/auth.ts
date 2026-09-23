export type UserRole = "cliente" | "parceiro" | "staff" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  store_id?: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  store_id: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  created_at: string;
}
