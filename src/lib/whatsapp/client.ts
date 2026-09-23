/**
 * WhatsApp Cloud API stub.
 * Without WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID → enqueue only + log.
 */

export function whatsappConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

export type EnqueueWhatsappInput = {
  to_phone: string;
  body: string;
  goal_id?: string | null;
  template_id?: string | null;
  media_url?: string | null;
  scheduled_at?: string | null;
};

export type EnqueueResult =
  | { ok: true; queue_id: string; sent: boolean; skipped_api: boolean }
  | { ok: false; error: string };

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 13) return digits;
  return digits;
}

export function renderTemplate(
  body: string,
  vars: Record<string, string>,
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

/** Persist to whatsapp_dispatch_queue; optionally attempt Meta send when keys exist. */
export async function enqueueWhatsapp(
  input: EnqueueWhatsappInput,
): Promise<EnqueueResult> {
  const to = normalizePhone(input.to_phone);
  if (!to || to.length < 10) {
    return { ok: false, error: "Telefone inválido." };
  }
  if (!input.body.trim()) {
    return { ok: false, error: "Mensagem vazia." };
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/admin");
    const admin = createServiceClient();
    const scheduled_at = input.scheduled_at ?? new Date().toISOString();

    const { data, error } = await admin
      .from("whatsapp_dispatch_queue")
      .insert({
        to_phone: to,
        body: input.body,
        goal_id: input.goal_id ?? null,
        template_id: input.template_id ?? null,
        media_url: input.media_url ?? null,
        status: "pending",
        scheduled_at,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Falha ao enfileirar." };
    }

    const queueId = data.id as string;

    if (!whatsappConfigured()) {
      console.info(
        "[whatsapp] stub — sem WHATSAPP_TOKEN/PHONE_NUMBER_ID; fila apenas",
        { queue_id: queueId, to },
      );
      await admin
        .from("whatsapp_dispatch_queue")
        .update({
          status: "skipped",
          error: "API não configurada (stub)",
          sent_at: new Date().toISOString(),
        })
        .eq("id", queueId);
      return { ok: true, queue_id: queueId, sent: false, skipped_api: true };
    }

    // Live send stub path when keys present (still no real Meta call without network intent)
    const token = process.env.WHATSAPP_TOKEN!.trim();
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: input.body },
          }),
        },
      );
      if (!res.ok) {
        const errText = await res.text();
        await admin
          .from("whatsapp_dispatch_queue")
          .update({ status: "failed", error: errText.slice(0, 500) })
          .eq("id", queueId);
        return { ok: true, queue_id: queueId, sent: false, skipped_api: false };
      }
      await admin
        .from("whatsapp_dispatch_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", queueId);
      return { ok: true, queue_id: queueId, sent: true, skipped_api: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : "send failed";
      await admin
        .from("whatsapp_dispatch_queue")
        .update({ status: "failed", error: message })
        .eq("id", queueId);
      return { ok: true, queue_id: queueId, sent: false, skipped_api: false };
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "WhatsApp indisponível";
    console.warn("[whatsapp]", message);
    return { ok: false, error: message };
  }
}
