import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isPixGatewayConfigured } from "@/lib/pix/mercadopago";

/**
 * Returns ONLY booleans — never secret values.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Somente admin." },
      { status: 403 },
    );
  }

  const mercadopago = isPixGatewayConfigured();
  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  return NextResponse.json({
    ok: true,
    mercadopago,
    serviceRole,
  });
}
