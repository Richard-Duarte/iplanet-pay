import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

const BUCKET = "used-device-photos";

/** Signed URLs for offer photos (owner or admin/staff). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as { offer_id?: string; paths?: string[] };
  const offerId = body.offer_id?.trim();
  const paths = body.paths ?? [];
  if (!offerId || paths.length === 0) {
    return NextResponse.json({ ok: false, error: "Parâmetros inválidos" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data: offer, error } = await admin
    .from("used_device_offers")
    .select("user_id, photo_paths")
    .eq("id", offerId)
    .maybeSingle();

  if (error || !offer) {
    return NextResponse.json({ ok: false, error: "Oferta não encontrada" }, { status: 404 });
  }

  const isOwner = offer.user_id === user.id;
  const isStaff = user.role === "admin" || user.role === "staff";
  if (!isOwner && !isStaff) {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }

  const allowed = new Set(offer.photo_paths as string[]);
  const safePaths = paths.filter((p) => allowed.has(p));
  const urls: Record<string, string> = {};

  for (const path of safePaths) {
    const { data, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);
    if (!signErr && data?.signedUrl) {
      urls[path] = data.signedUrl;
    }
  }

  return NextResponse.json({ ok: true, urls });
}
