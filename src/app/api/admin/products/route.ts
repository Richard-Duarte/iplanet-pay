import { NextResponse } from "next/server";
import { createProduct, updateProduct } from "@/lib/catalog/admin-products";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const list_price_cents = Number(body.list_price_cents);
  const result = await createProduct({
    name: String(body.name ?? ""),
    slug: body.slug ? String(body.slug) : undefined,
    brand: body.brand ? String(body.brand) : undefined,
    model: String(body.model ?? ""),
    storage: String(body.storage ?? ""),
    color: body.color != null ? String(body.color) : null,
    list_price_cents,
    image_url: body.image_url != null ? String(body.image_url) : null,
    description: body.description != null ? String(body.description) : null,
    active: body.active !== false,
    category_id: body.category_id ? String(body.category_id) : null,
    new_category_name: body.new_category_name
      ? String(body.new_category_name)
      : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, product: result.product });
}

export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Produto inválido." },
      { status: 400 },
    );
  }

  const list_price_cents = Number(body.list_price_cents);
  const result = await updateProduct({
    id,
    name: String(body.name ?? ""),
    slug: body.slug ? String(body.slug) : undefined,
    brand: body.brand ? String(body.brand) : undefined,
    model: String(body.model ?? ""),
    storage: String(body.storage ?? ""),
    color: body.color != null ? String(body.color) : null,
    list_price_cents,
    image_url: body.image_url != null ? String(body.image_url) : null,
    description: body.description != null ? String(body.description) : null,
    active: body.active !== false,
    category_id: body.category_id ? String(body.category_id) : null,
    new_category_name: body.new_category_name
      ? String(body.new_category_name)
      : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, product: result.product });
}
