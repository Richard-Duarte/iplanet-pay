import { NextResponse } from "next/server";

/**
 * Placeholder HTTP webhook (alternativa à Edge Function).
 * TODO: validar assinatura e encaminhar para crédito atômico.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Webhook Pix stub — ver supabase/functions/pix-webhook",
    },
    { status: 501 },
  );
}
