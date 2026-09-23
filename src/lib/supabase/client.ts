import { createBrowserClient } from "@supabase/ssr";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export function createClient() {
  if (USE_MOCK_AUTH) {
    throw new Error("Supabase client indisponível em modo mock.");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function isSupabaseConfigured() {
  return !USE_MOCK_AUTH;
}
