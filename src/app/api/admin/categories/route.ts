import { NextResponse } from "next/server";
import { createCategory, updateCategory } from "@/lib/catalog/categories";

export async function POST(request: Request) {
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }
  const result = await createCategory(body.name ?? "");
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, category: result.category });
}

export async function PATCH(request: Request) {
  let body: {
    id?: string;
    name?: string;
    sort_order?: number;
    active?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }
  const result = await updateCategory({
    id: body.id ?? "",
    name: body.name,
    sort_order: body.sort_order,
    active: body.active,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, category: result.category });
}
