import { NextResponse } from "next/server";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";
import { getCurrentUser } from "@/lib/auth/session";
import { getReservationById } from "@/lib/reservations/queries";
import { createClient } from "@/lib/supabase/server";
import { MAX_USED_DEVICE_PHOTOS } from "@/lib/trade-in/constants";
import {
  mockHasPendingOffer,
  mockInsertOffer,
} from "@/lib/trade-in/mock";

const BUCKET = "used-device-photos";

function parseBrlToCents(raw: string): number | null {
  const normalized = raw.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function mapSubmitRpcError(message: string | undefined): string {
  if (!message) return "Não foi possível enviar.";
  const m = message.toLowerCase();
  if (m.includes("create_used_device_offer")) {
    return "Recurso de avaliação ainda não está ativo no banco. Aplique a migration 023_trade_in_client_submit.";
  }
  return message;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Faça login." }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const reservationId = String(form.get("reservation_id") ?? "").trim();
    const deviceModel = String(form.get("device_model") ?? "").trim();
    const imei = String(form.get("imei") ?? "").trim().replace(/\s/g, "");
    const expectedCents = parseBrlToCents(String(form.get("expected_value_brl") ?? ""));
    const minimumCents = parseBrlToCents(String(form.get("minimum_value_brl") ?? ""));
    const maintenanceRaw = String(form.get("maintenance_options") ?? "[]");
    const liquidRaw = String(form.get("liquid_exposure") ?? "").trim();
    if (liquidRaw !== "true" && liquidRaw !== "false") {
      return NextResponse.json(
        { ok: false, error: "Selecione Sim ou Não para exposição a líquidos." },
        { status: 400 },
      );
    }
    const liquidExposure = liquidRaw === "true";

    let maintenanceOptions: string[] = [];
    try {
      maintenanceOptions = JSON.parse(maintenanceRaw) as string[];
      if (!Array.isArray(maintenanceOptions)) maintenanceOptions = [];
    } catch {
      maintenanceOptions = [];
    }

    if (!reservationId || !deviceModel || !imei) {
      return NextResponse.json(
        { ok: false, error: "Preencha modelo e IMEI." },
        { status: 400 },
      );
    }
    if (!expectedCents || !minimumCents) {
      return NextResponse.json(
        { ok: false, error: "Informe valores esperado e mínimo válidos." },
        { status: 400 },
      );
    }
    if (minimumCents > expectedCents) {
      return NextResponse.json(
        { ok: false, error: "O valor mínimo não pode ser maior que o esperado." },
        { status: 400 },
      );
    }
    if (maintenanceOptions.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Selecione ao menos uma opção de manutenção." },
        { status: 400 },
      );
    }

    const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Envie ao menos uma foto do aparelho." },
        { status: 400 },
      );
    }
    if (files.length > MAX_USED_DEVICE_PHOTOS) {
      return NextResponse.json(
        { ok: false, error: `Máximo de ${MAX_USED_DEVICE_PHOTOS} fotos.` },
        { status: 400 },
      );
    }

    const { reservation, error: reservationError } = await getReservationById(reservationId);
    if (reservationError || !reservation) {
      return NextResponse.json(
        {
          ok: false,
          error: reservationError ?? "Reserva não encontrada.",
        },
        { status: 404 },
      );
    }
    if (reservation.user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
    }
    if (reservation.status !== "ativa") {
      return NextResponse.json(
        { ok: false, error: "Só reservas ativas aceitam oferta de usado." },
        { status: 400 },
      );
    }

    if (USE_MOCK_AUTH) {
      if (mockHasPendingOffer(reservationId, user.id)) {
        return NextResponse.json(
          { ok: false, error: "Você já tem uma solicitação pendente de avaliação." },
          { status: 400 },
        );
      }
      const { id: offerId } = mockInsertOffer({
        userId: user.id,
        reservationId,
        deviceModel,
        imei,
        expectedCents,
        minimumCents,
        maintenanceOptions,
        liquidExposure,
        photoCount: files.length,
      });
      return NextResponse.json({ ok: true, offer_id: offerId });
    }

    const supabase = await createClient();
    const offerId = crypto.randomUUID();
    const photoPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      if (file.size > 6 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, error: "Cada foto deve ter no máximo 6 MB." },
          { status: 400 },
        );
      }
      const ext = file.type.includes("png") ? "png" : "jpg";
      const path = `${user.id}/${offerId}/${i}.${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (uploadError) {
        return NextResponse.json(
          { ok: false, error: `Falha no upload: ${uploadError.message}` },
          { status: 400 },
        );
      }
      photoPaths.push(path);
    }

    const { data: rpcId, error: rpcError } = await supabase.rpc("create_used_device_offer", {
      p_offer_id: offerId,
      p_reservation_id: reservationId,
      p_device_model: deviceModel,
      p_imei: imei,
      p_expected_value_cents: expectedCents,
      p_minimum_value_cents: minimumCents,
      p_maintenance_options: maintenanceOptions,
      p_liquid_exposure: liquidExposure,
      p_photo_paths: photoPaths,
    });

    if (rpcError) {
      for (const path of photoPaths) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
      return NextResponse.json(
        { ok: false, error: mapSubmitRpcError(rpcError.message) },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, offer_id: (rpcId as string) ?? offerId });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Falha ao enviar." },
      { status: 500 },
    );
  }
}
