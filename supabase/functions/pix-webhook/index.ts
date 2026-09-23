/**
 * Edge Function: pix-webhook
 *
 * Fluxo (adaptado de Smart Pay handle-pix-webhook):
 * 1. Recebe notificação Mercado Pago (POST/GET).
 * 2. Verificação de assinatura: stub — defina MERCADOPAGO_WEBHOOK_SECRET
 *    e complete HMAC quando o secret estiver provisionado.
 * 3. upsert_webhook_inbox (idempotente por provider+event_id).
 * 4. Consulta pagamento no MP; se approved → confirm_contribution (service_role).
 * 5. Marca inbox processed / ignored / error.
 *
 * Deploy: supabase functions deploy pix-webhook --no-verify-jwt
 * (webhooks externos não enviam JWT do usuário)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SERVICE_ROLE_KEY") ||
      "";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL / SERVICE_ROLE_KEY não configurados");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Signature stub
    const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    if (webhookSecret) {
      const sig = req.headers.get("x-signature");
      if (!sig) {
        console.warn(
          "pix-webhook: secret set but no x-signature — stub accept (implement HMAC later)",
        );
      }
    } else {
      console.warn("pix-webhook: MERCADOPAGO_WEBHOOK_SECRET ausente — stub");
    }

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const idFromQuery =
      url.searchParams.get("id") || url.searchParams.get("data.id");

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const paymentId = String(
      idFromQuery ||
        (body?.data as { id?: string | number } | undefined)?.id ||
        body?.id ||
        "",
    ).trim();

    console.log("Webhook received:", { topic, paymentId, body });

    if (!paymentId) {
      return json({ ok: true, skipped: true, message: "sem payment id" });
    }

    const { data: inbox, error: inboxError } = await supabaseAdmin.rpc(
      "upsert_webhook_inbox",
      {
        p_provider: "mercado_pago",
        p_external_event_id: `payment:${paymentId}`,
        p_payload: { topic, payment_id: paymentId, body },
      },
    );
    if (inboxError) throw new Error(inboxError.message);

    const inboxRow = inbox as {
      id: string;
      already_processed?: boolean;
    };
    if (inboxRow?.already_processed) {
      return json({
        ok: true,
        skipped: true,
        message: "já processado",
        inbox_id: inboxRow.id,
      });
    }

    const accessToken =
      Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ||
      Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ||
      "";
    if (!accessToken) {
      await supabaseAdmin.rpc("mark_webhook_processed", {
        p_inbox_id: inboxRow.id,
        p_status: "error",
        p_error: "MERCADOPAGO_ACCESS_TOKEN ausente",
      });
      throw new Error("Token Mercado Pago não configurado na Edge Function");
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const paymentData = await mpRes.json();
    if (!mpRes.ok) {
      await supabaseAdmin.rpc("mark_webhook_processed", {
        p_inbox_id: inboxRow.id,
        p_status: "error",
        p_error: `mp_${mpRes.status}`,
      });
      throw new Error(`Mercado Pago erro [${mpRes.status}]`);
    }

    const status = paymentData.status as string;
    const externalReference = paymentData.external_reference as
      | string
      | null;
    const mpId = String(paymentData.id);

    if (status !== "approved") {
      await supabaseAdmin.rpc("mark_webhook_processed", {
        p_inbox_id: inboxRow.id,
        p_status: "ignored",
        p_error: `status=${status}`,
      });
      return json({
        ok: true,
        skipped: true,
        message: `status ${status}`,
        inbox_id: inboxRow.id,
      });
    }

    let contributionId = externalReference || null;
    if (!contributionId || contributionId === "null") {
      const { data: found } = await supabaseAdmin
        .from("contributions")
        .select("id")
        .eq("gateway_payment_id", mpId)
        .eq("status", "pending")
        .maybeSingle();
      contributionId = found?.id ?? null;
    } else {
      await supabaseAdmin
        .from("contributions")
        .update({ gateway_payment_id: mpId })
        .eq("id", contributionId);
    }

    if (!contributionId) {
      await supabaseAdmin.rpc("mark_webhook_processed", {
        p_inbox_id: inboxRow.id,
        p_status: "error",
        p_error: "contribution_not_found",
      });
      throw new Error(`Aporte não encontrado para payment ${mpId}`);
    }

    const { error: confirmError } = await supabaseAdmin.rpc(
      "confirm_contribution",
      { p_contribution_id: contributionId },
    );
    if (confirmError) {
      await supabaseAdmin.rpc("mark_webhook_processed", {
        p_inbox_id: inboxRow.id,
        p_status: "error",
        p_error: confirmError.message,
      });
      throw new Error(confirmError.message);
    }

    await supabaseAdmin.rpc("mark_webhook_processed", {
      p_inbox_id: inboxRow.id,
      p_status: "processed",
      p_error: null,
    });

    return json({
      ok: true,
      contribution_id: contributionId,
      inbox_id: inboxRow.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("pix-webhook error:", message);
    return json({ ok: false, error: message }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
