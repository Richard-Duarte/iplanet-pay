import { NextResponse } from "next/server";
import { processPixWebhook } from "@/lib/pix/webhook";

/**
 * Webhook HTTP (alternativa à Edge Function pix-webhook).
 * Requer SUPABASE_SERVICE_ROLE_KEY no .env.local da app.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let rawBody: unknown = {};
  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }

  const result = await processPixWebhook({
    rawBody,
    searchParams: url.searchParams,
    headers: request.headers,
  });

  // Mercado Pago espera 200 para não retentar agressivamente em erros de negócio.
  return NextResponse.json(
    {
      ok: result.ok,
      message: result.message,
      contribution_id: result.contribution_id,
      inbox_id: result.inbox_id,
      skipped: result.skipped,
    },
    { status: 200 },
  );
}

export async function GET(request: Request) {
  // Alguns IPNs do MP usam GET com query params
  const url = new URL(request.url);
  const result = await processPixWebhook({
    rawBody: {},
    searchParams: url.searchParams,
    headers: request.headers,
  });
  return NextResponse.json(result, { status: 200 });
}
