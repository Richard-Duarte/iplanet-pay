import type { UserRole } from "./auth";

export interface Store {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  created_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  storage: string;
  color: string | null;
  list_price_cents: number;
  image_url: string | null;
  description?: string | null;
  product_images?: string[] | null;
  active: boolean;
  category?: string;
  category_id?: string | null;
  created_at?: string;
}

export type PaymentGoalStatus = "active" | "paused" | "done" | "cancelled";

export interface PaymentGoal {
  id: string;
  user_id: string;
  product_id: string;
  reservation_id: string | null;
  name: string;
  target_date: string;
  reminder_at: string | null;
  amount_cents: number;
  installment_cents: number;
  installments_count: number;
  status: PaymentGoalStatus;
  whatsapp_phone: string | null;
  created_at: string;
}

export type WhatsappTemplateKind =
  | "aviso"
  | "cobranca"
  | "promocao"
  | "bonus"
  | "custom";

export interface WhatsappTemplate {
  id: string;
  name: string;
  kind: WhatsappTemplateKind;
  body: string;
  active: boolean;
  created_at?: string;
}

export type WhatsappDispatchStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped";

export interface WhatsappDispatchQueueItem {
  id: string;
  goal_id: string | null;
  template_id: string | null;
  to_phone: string;
  body: string;
  media_url: string | null;
  status: WhatsappDispatchStatus;
  scheduled_at: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export interface StoreStock {
  id: string;
  store_id: string;
  product_id: string;
  qty_available: number;
}

export interface ProductWithStock extends Product {
  store_stock: Array<{
    qty_available: number;
    store: Pick<Store, "id" | "name" | "slug"> | null;
  }>;
}

export type ReservationStatus = "ativa" | "quitada" | "cancelada" | "retirada" | "trocada";

export interface Reservation {
  id: string;
  user_id: string;
  product_id: string;
  store_id: string;
  status: ReservationStatus;
  list_price_cents: number;
  amount_paid_cents: number;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type { UserRole };


export type ContributionStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "refunded"
  | "expired";

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

export type WalletEntryType = "aporte" | "aplicacao" | "estorno" | "ajuste";

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
