import { NextResponse } from "next/server";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";
import { tryCreateServiceClient } from "@/lib/supabase/admin";
import {
  APORTE_CONTRACT_TEXT,
  APORTE_CONTRACT_VERSION,
} from "@/lib/aportes/contract";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Entre para continuar." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    reservation_id?: string;
    contract_version?: string;
    scrolled_to_end?: boolean;
    fingerprint?: unknown;
  };

  const reservationId = (body.reservation_id ?? "").trim();
  if (!reservationId) {
    return NextResponse.json({ ok: false, error: "Reserva inválida." }, { status: 400 });
  }
  if (body.scrolled_to_end !== true) {
    return NextResponse.json(
      { ok: false, error: "O contrato só pode ser aceito depois de lido até o fim." },
      { status: 400 },
    );
  }
  if (body.contract_version && body.contract_version !== APORTE_CONTRACT_VERSION) {
    return NextResponse.json(
      { ok: false, error: "Versão do contrato desatualizada. Atualize a página." },
      { status: 400 },
    );
  }
  if (!body.fingerprint || typeof body.fingerprint !== "object") {
    return NextResponse.json(
      { ok: false, error: "Não foi possível ler o dispositivo." },
      { status: 400 },
    );
  }

  if (USE_MOCK_AUTH) {
    return NextResponse.json({ ok: true, id: "mock-contract" });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const sessionClient = await createClient();
  const { data: reservation } = await sessionClient
    .from("reservations")
    .select("id, user_id")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation || reservation.user_id !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Esta reserva não é da sua conta." },
      { status: 403 },
    );
  }

  const row = {
    user_id: user.id,
    reservation_id: reservationId,
    contract_version: APORTE_CONTRACT_VERSION,
    contract_text: APORTE_CONTRACT_TEXT,
    scrolled_to_end: true,
    ip: clientIp(request),
    user_agent: request.headers.get("user-agent"),
    accept_language: request.headers.get("accept-language"),
    fingerprint: body.fingerprint,
  };

  const admin = tryCreateServiceClient();
  const db = admin ?? sessionClient;
  const { data, error } = await db.from("aporte_contracts").insert(row).select("id").single();
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Falha ao gravar o contrato." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, id: data.id });
}
