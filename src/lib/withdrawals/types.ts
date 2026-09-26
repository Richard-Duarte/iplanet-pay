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

export const TERMS_VERSION = "platform-v2";

export const TERMS_OF_USE_PT = `
TERMOS DE USO — iPlanet Pay (versão platform-v2)

1. Aportes e reserva
Ao reservar um produto e realizar aportes via Pix, você concorda com as regras da plataforma iPlanet Pay.

2. Política de saque (reembolso de aportes)
Saques liberados após 15 dias de conta ativa e apenas quando os aportes confirmados na reserva superarem R$ 1.000,00.
Sobre o valor total dos aportes confirmados elegíveis:
• Você recebe 70% (reembolso líquido).
• A plataforma retém 30% a título de taxa administrativa.
Bônus de indicação não aplicados e valores não confirmados não entram na base de saque.

3. Retirada do aparelho
Com 100% quitado, você pode solicitar retirada na loja ou envio (frete + seguro via Pix).
Com 70% ou mais, a entrega antecipada exige assinatura de contrato de empréstimo do aparelho até quitação total.

4. Indicações
O indicado deve aportar no mínimo R$ 100,00 confirmados para liberar o bônus ao indicador, que poderá direcionar o valor a uma reserva ativa.

5. Fichas e sorteio
A cada R$ 100,00 em aportes confirmados você recebe 1 ficha para o sorteio mensal (dia 1). Mais fichas aumentam suas chances de liberação antecipada do aparelho.

6. Prazo de reembolso Pix
Após aprovação do saque pelo Financeiro, o Pix é efetuado em até 24 horas úteis (estimativa).

7. Aceite
Ao criar conta e marcar os aceites, você declara ter lido estes termos, política de saque, regras de retirada, indicação e sorteio.
`.trim();
