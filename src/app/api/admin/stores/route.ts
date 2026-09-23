import { NextResponse } from "next/server";
import { deleteStore, upsertStore } from "@/lib/stores/mutations";

export async function POST(request: Request) {
  let body: {
    name?: string;
    slug?: string;
    address?: string;
    city?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }
  const result = await upsertStore({
    name: body.name ?? "",
    slug: body.slug,
    address: body.address ?? "",
    city: body.city ?? "",
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, store: result.store });
}

export async function PATCH(request: Request) {
  let body: {
    id?: string;
    name?: string;
    slug?: string;
    address?: string;
    city?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }
  const result = await upsertStore({
    id: body.id,
    name: body.name ?? "",
    slug: body.slug,
    address: body.address ?? "",
    city: body.city ?? "",
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, store: result.store });
}

export async function DELETE(request: Request) {
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }
  const result = await deleteStore(body.id ?? "");
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
