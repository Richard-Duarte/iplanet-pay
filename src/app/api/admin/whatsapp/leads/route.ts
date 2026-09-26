import { NextResponse } from "next/server";
import { listWhatsappBroadcastLeads } from "@/lib/whatsapp/admin";

export async function GET() {
  const { leads, error } = await listWhatsappBroadcastLeads();
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 403 });
  }
  return NextResponse.json({ ok: true, leads });
}
