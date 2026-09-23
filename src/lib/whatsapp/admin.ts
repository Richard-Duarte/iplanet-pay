import { getCurrentUser } from "@/lib/auth/session";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import type { WhatsappTemplate } from "@/types/database";
import { enqueueWhatsapp, renderTemplate, whatsappConfigured } from "./client";
import { formatCentsBRL } from "@/lib/utils";

export async function listWhatsappTemplates(): Promise<{
  templates: WhatsappTemplate[];
  error: string | null;
}> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { templates: [], error: "Somente admin." };
  }
  if (USE_MOCK_AUTH) {
    return {
      templates: [
        {
          id: "mock-1",
          name: "primeiro_aporte",
          kind: "aviso",
          body: "Oi {{nome}}! Aporte {{valor}} em {{produto}}.",
          active: true,
        },
      ],
      error: null,
    };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .order("name");
    if (error) return { templates: [], error: error.message };
    return { templates: (data ?? []) as WhatsappTemplate[], error: null };
  } catch (err) {
    return {
      templates: [],
      error: err instanceof Error ? err.message : "Falha",
    };
  }
}

export async function updateWhatsappTemplate(input: {
  id: string;
  body: string;
  kind?: string;
  active?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "Somente admin." };
  }
  if (USE_MOCK_AUTH) return { ok: true };
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const patch: Record<string, unknown> = { body: input.body };
    if (input.kind) patch.kind = input.kind;
    if (typeof input.active === "boolean") patch.active = input.active;
    const { error } = await supabase
      .from("whatsapp_templates")
      .update(patch)
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha",
    };
  }
}

export type BroadcastAudience = "clients_phone" | "active_goals" | "paste";

export async function broadcastWhatsapp(input: {
  template_id: string;
  audience: BroadcastAudience;
  paste_phones?: string;
}): Promise<
  | { ok: true; enqueued: number; api_configured: boolean }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, error: "Somente admin." };
  }
  if (USE_MOCK_AUTH) {
    return { ok: true, enqueued: 0, api_configured: false };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const admin = createServiceClient();

    const { data: tpl, error: tplErr } = await admin
      .from("whatsapp_templates")
      .select("*")
      .eq("id", input.template_id)
      .maybeSingle();
    if (tplErr || !tpl) {
      return { ok: false, error: tplErr?.message ?? "Template não encontrado." };
    }

    const phones: Array<{ phone: string; nome: string; produto: string; meta: string }> =
      [];

    if (input.audience === "paste") {
      const raw = (input.paste_phones ?? "")
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const p of raw) {
        phones.push({
          phone: p,
          nome: "olá",
          produto: "iPlanet Pay",
          meta: "promoção",
        });
      }
    } else if (input.audience === "clients_phone") {
      const { data: profiles } = await admin
        .from("profiles")
        .select("full_name, phone, role")
        .eq("role", "cliente")
        .not("phone", "is", null);
      for (const p of profiles ?? []) {
        if (!p.phone) continue;
        phones.push({
          phone: p.phone,
          nome: p.full_name?.split(" ")[0] || "olá",
          produto: "iPlanet Pay",
          meta: "sua conta",
        });
      }
    } else {
      const { data: goals } = await admin
        .from("payment_goals")
        .select("id, name, whatsapp_phone, user_id, product_id")
        .eq("status", "active");
      const userIds = [...new Set((goals ?? []).map((g) => g.user_id))];
      const productIds = [
        ...new Set((goals ?? []).map((g) => g.product_id).filter(Boolean)),
      ];
      const { data: profiles } = userIds.length
        ? await admin
            .from("profiles")
            .select("id, full_name, phone")
            .in("id", userIds)
        : { data: [] as Array<{ id: string; full_name: string | null; phone: string | null }> };
      const { data: products } = productIds.length
        ? await admin.from("products").select("id, name").in("id", productIds)
        : { data: [] as Array<{ id: string; name: string }> };
      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p] as const),
      );
      const productMap = new Map(
        (products ?? []).map((p) => [p.id, p] as const),
      );
      for (const g of goals ?? []) {
        const profile = profileMap.get(g.user_id);
        const phone = g.whatsapp_phone || profile?.phone;
        if (!phone) continue;
        phones.push({
          phone,
          nome: profile?.full_name?.split(" ")[0] || "olá",
          produto: productMap.get(g.product_id)?.name || "seu Apple",
          meta: g.name,
        });
      }
    }

    let enqueued = 0;
    for (const row of phones) {
      const body = renderTemplate(tpl.body, {
        nome: row.nome,
        produto: row.produto,
        valor: formatCentsBRL(0),
        pix: "QR estará disponível quando Pix estiver configurado",
        meta: row.meta,
      });
      const r = await enqueueWhatsapp({
        to_phone: row.phone,
        body,
        template_id: tpl.id,
      });
      if (r.ok) enqueued += 1;
    }

    return {
      ok: true,
      enqueued,
      api_configured: whatsappConfigured(),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha no disparo",
    };
  }
}

export { whatsappConfigured };
