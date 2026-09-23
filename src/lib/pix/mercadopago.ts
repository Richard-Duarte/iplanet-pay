import type { PixChargeResult } from "@/lib/pix/types";

/** Env names (iPlanet prefers env vars this phase — no secrets in git). */
export function getMercadoPagoAccessToken(): string | null {
  const token =
    process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ||
    "";
  return token || null;
}

export function isPixGatewayConfigured(): boolean {
  return Boolean(getMercadoPagoAccessToken());
}

export async function generatePixMercadoPago(params: {
  amountCents: number;
  description: string;
  payerEmail: string;
  contributionId: string;
  notificationUrl?: string;
}): Promise<PixChargeResult> {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new Error(
      "Gateway Pix não configurado. Defina MERCADOPAGO_ACCESS_TOKEN (ou MERCADO_PAGO_ACCESS_TOKEN) no ambiente.",
    );
  }

  const amountReais = Number((params.amountCents / 100).toFixed(2));
  const body: Record<string, unknown> = {
    transaction_amount: amountReais,
    description: params.description,
    payment_method_id: "pix",
    payer: { email: params.payerEmail || "cliente@iplanetpay.com.br" },
    external_reference: params.contributionId,
  };
  if (params.notificationUrl) {
    body.notification_url = params.notificationUrl;
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    id?: number | string;
    message?: string;
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
      };
    };
  };

  if (!response.ok) {
    throw new Error(
      `Mercado Pago erro [${response.status}]: ${data.message || "Falha ao gerar Pix"}`,
    );
  }

  const txn = data.point_of_interaction?.transaction_data;
  const copy = txn?.qr_code || "";
  return {
    provider: "mercado_pago",
    external_id: String(data.id ?? ""),
    qr_copy_paste: copy,
    qr_base64: txn?.qr_code_base64 || "",
    raw: data,
  };
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<{
  id: string;
  status: string;
  external_reference: string | null;
}> {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new Error("Gateway Pix não configurado (token Mercado Pago ausente).");
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = (await response.json()) as {
    id?: number | string;
    status?: string;
    external_reference?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      `Mercado Pago erro [${response.status}]: ${data.message || "Falha ao consultar pagamento"}`,
    );
  }
  return {
    id: String(data.id ?? paymentId),
    status: data.status ?? "",
    external_reference: data.external_reference ?? null,
  };
}
