/**
 * Edge Function stub: pix-webhook (Deno / Supabase Edge Runtime)
 *
 * Fluxo esperado (NÃO implementado nesta fase — apenas documentação):
 * 1. Gateway Pix POSTa notificação assinada.
 * 2. Validar assinatura / HMAC e idempotency-key.
 * 3. Inserir evento bruto em webhooks_inbox (unique por provider+event_id).
 * 4. Em transação SQL atômica:
 *    - Localizar cobrança (pix_charges) pelo txid / end_to_end_id.
 *    - Creditar wallet_ledger (tipo aporte) vinculado à reservation_id.
 *    - Atualizar reservation.amount_paid / status (ex.: ativa → quitada).
 *    - Marcar webhook como processed.
 * 5. Nunca creditar duas vezes o mesmo evento (idempotência obrigatória).
 * 6. Responder 200 rápido; reprocessar via job se necessário.
 *
 * TODO: implementar crédito atômico + verificação de assinatura.
 *
 * Deploy: `supabase functions deploy pix-webhook`
 * Este arquivo roda no Edge Runtime (Deno), não no Next.js.
 */

// @ts-nocheck
/* eslint-disable */

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // const payload = await req.json();
  // TODO: verify signature, upsert webhook inbox, atomic credit

  return new Response(
    JSON.stringify({
      ok: false,
      message: "pix-webhook stub — crédito atômico ainda não implementado",
    }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
});
