import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Bot Telegram ainda não configurado. Defina TELEGRAM_BOT_TOKEN quando o produto estiver 100%.",
      },
      { status: 503 },
    );
  }

  if (secret) {
    const hdr = request.headers.get("x-telegram-bot-api-secret-token");
    if (hdr !== secret) {
      return NextResponse.json({ ok: false, error: "Secret inválido." }, { status: 401 });
    }
  }

  // Stub: accept payload, do not call Telegram API without explicit enable
  await request.json().catch(() => ({}));
  return NextResponse.json({
    ok: true,
    message: "Webhook recebido (modo stub — sem resposta automática).",
  });
}

export async function GET() {
  const configured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  return NextResponse.json({
    ok: true,
    telegram_bot_configured: configured,
    message: configured
      ? "Token presente — webhook em modo stub."
      : "TELEGRAM_BOT_TOKEN vazio. Conecte as chaves quando o produto estiver 100%.",
  });
}
