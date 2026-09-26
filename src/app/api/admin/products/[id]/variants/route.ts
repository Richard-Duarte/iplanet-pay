import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }
  const { id } = await context.params;
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("created_at");
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, variants: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Falha" },
      { status: 503 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
  }
  const { id: productId } = await context.params;
  let body: {
    model?: string;
    color?: string;
    storage?: string;
    price_cents?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  if (!body.price_cents || body.price_cents <= 0) {
    return NextResponse.json({ ok: false, error: "Preço inválido" }, { status: 400 });
  }
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("product_variants")
      .insert({
        product_id: productId,
        model: body.model?.trim() || null,
        color: body.color?.trim() || null,
        storage: body.storage?.trim() || null,
        price_cents: body.price_cents,
        active: true,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, variant: data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Falha" },
      { status: 503 },
    );
  }
}
