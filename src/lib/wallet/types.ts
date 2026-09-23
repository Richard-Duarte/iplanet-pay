export type ContributionStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "refunded"
  | "expired";

export type WalletEntryType = "aporte" | "aplicacao" | "estorno" | "ajuste";

export interface Contribution {
  id: string;
  user_id: string;
  reservation_id: string;
  amount_cents: number;
  payment_method: string;
  status: ContributionStatus;
  pix_code: string | null;
  pix_qr_base64: string | null;
  gateway_payment_id: string | null;
  gateway_provider: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletLedgerEntry {
  id: string;
  user_id: string;
  reservation_id: string | null;
  contribution_id: string | null;
  entry_type: WalletEntryType;
  amount_cents: number;
  memo: string | null;
  created_at: string;
}

export const CONTRIBUTION_STATUS_LABEL: Record<ContributionStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  failed: "Falhou",
  refunded: "Estornado",
  expired: "Expirado",
};

export const LEDGER_ENTRY_LABEL: Record<WalletEntryType, string> = {
  aporte: "Aporte",
  aplicacao: "Aplicação",
  estorno: "Estorno",
  ajuste: "Ajuste",
};

export const MIN_CONTRIBUTION_CENTS = 500;

export const CONTRIBUTION_SELECT = `
  id,
  user_id,
  reservation_id,
  amount_cents,
  payment_method,
  status,
  pix_code,
  pix_qr_base64,
  gateway_payment_id,
  gateway_provider,
  confirmed_at,
  created_at,
  updated_at
`;
