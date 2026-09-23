import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for webhooks / privileged RPCs.
 * Throws clearly when SUPABASE_SERVICE_ROLE_KEY is missing.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
  }
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Webhooks Pix precisam da service role para confirmar aportes.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
