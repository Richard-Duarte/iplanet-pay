import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { MAX_USED_DEVICE_PHOTOS } from "@/lib/trade-in/constants";

const BUCKET = "used-device-photos";

function parseBrlToCents(raw: string): number | null {
  const normalized = raw.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
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
    const liquidExposure = String(form.get("liquid_exposure") ?? "false") === "true";

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

    const admin = createServiceClient();

    const { data: reservation, error: resErr } = await admin
      .from("reservations")
      .select("id, user_id, status")
      .eq("id", reservationId)
      .maybeSingle();

    if (resErr || !reservation) {
      return NextResponse.json({ ok: false, error: "Reserva não encontrada." }, { status: 404 });
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

    const { data: pending } = await admin
      .from("used_device_offers")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1);

    if (pending && pending.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Você já tem uma solicitação pendente de avaliação." },
        { status: 400 },
      );
    }

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
      const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
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

    const { error: insertError } = await admin.from("used_device_offers").insert({
      id: offerId,
      user_id: user.id,
      reservation_id: reservationId,
      device_model: deviceModel,
      imei,
      expected_value_cents: expectedCents,
      minimum_value_cents: minimumCents,
      maintenance_options: maintenanceOptions,
      liquid_exposure: liquidExposure,
      photo_paths: photoPaths,
      status: "pending",
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, offer_id: offerId });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Falha ao enviar." },
      { status: 500 },
    );
  }
}
