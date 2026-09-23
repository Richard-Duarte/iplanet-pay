export interface PixChargeResult {
  provider: string;
  external_id: string;
  qr_copy_paste: string;
  qr_base64: string;
  raw?: unknown;
}

export type GeneratePixOutcome =
  | {
      ok: true;
      contribution_id: string;
      amount_cents: number;
      gateway_configured: true;
      pix: {
        copy_paste: string;
        qr_base64: string;
        charge_id: string;
        provider: string;
      };
    }
  | {
      ok: true;
      contribution_id: string;
      amount_cents: number;
      gateway_configured: false;
      pix: null;
      error: string;
    }
  | { ok: false; error: string };
