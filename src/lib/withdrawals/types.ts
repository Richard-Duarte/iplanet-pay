import type {
  PixKeyType,
  WithdrawalPayoutStatus,
  WithdrawalRequest,
  WithdrawalStatus,
} from "@/types/database";

export type {
  PixKeyType,
  WithdrawalPayoutStatus,
  WithdrawalRequest,
  WithdrawalStatus,
};

export const WITHDRAWAL_FEE_PCT_DEFAULT = 30;

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

export const PAYOUT_STATUS_LABEL: Record<WithdrawalPayoutStatus, string> = {
  pending_admin: "Aguardando admin",
  pending_gateway: "Aguardando gateway",
  queued: "Na fila",
  sent: "Enviado",
  failed: "Falhou",
};

export const PIX_KEY_TYPE_LABEL: Record<PixKeyType, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  phone: "Telefone",
  random: "Aleatória",
};

export const WITHDRAWAL_SELECT = `
  id,
  user_id,
  reservation_id,
  total_paid_cents,
  fee_percentage,
  fee_amount_cents,
  refund_amount_cents,
  pix_key,
  pix_key_type,
  holder_full_name,
  holder_cpf,
  status,
  payout_status,
  admin_notes,
  processed_at,
  processed_by,
  password_confirmed_at,
  created_at,
  updated_at
`;

export function calcWithdrawalAmounts(
  totalPaidCents: number,
  feePct = WITHDRAWAL_FEE_PCT_DEFAULT,
) {
  const fee = Math.round((totalPaidCents * feePct) / 100);
  const refund = totalPaidCents - fee;
  return { fee_amount_cents: fee, refund_amount_cents: refund, fee_percentage: feePct };
}

export const TERMS_VERSION = "withdrawal-v1";

export const TERMS_OF_USE_PT = `
TERMOS DE USO — iPlanet Pay (versão withdrawal-v1)

1. Aportes e reserva
Ao reservar um produto e realizar aportes via Pix, você concorda com as regras da plataforma iPlanet Pay.

2. Política de saque (reembolso de aportes)
Você pode solicitar o saque dos aportes confirmados de uma reserva ativa. Sobre o valor total dos aportes confirmados:
• Você recebe 70% (reembolso líquido).
• A plataforma retém 30% a título de taxa administrativa.
Bônus, cashback e valores não confirmados não são reembolsáveis.

3. Prazo
Após a aprovação do saque pela equipe Financeiro, o Pix de reembolso é efetuado em até 24 horas úteis (prazo estimado; sujeito à configuração do gateway de pagamento).

4. Dados do Pix
Na solicitação você deve informar: chave Pix, tipo da chave, nome completo e CPF do titular da chave. Dados incorretos podem atrasar ou impedir o pagamento.

5. Efeito na reserva
Ao solicitar o saque, a reserva fica com status "saque pendente". Após aprovação, a reserva é marcada como "sacada" e deixa de estar disponível para novos aportes ou retirada do aparelho. Em caso de rejeição, a reserva volta a "ativa".

6. Aceite
Ao criar conta e marcar o aceite destes Termos, você declara ter lido e concordado com esta política de saque e demais condições de uso da iPlanet Pay.
`.trim();
