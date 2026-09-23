export async function getAppSettings(
  keys: string[],
): Promise<{ settings: Record<string, string>; error: string | null }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", keys);
    if (error) return { settings: {}, error: error.message };
    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }
    return { settings, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao carregar configurações";
    return { settings: {}, error: message };
  }
}
