import { appBaseUrl, ctaButton, emailShell } from "../layout";
import { formatCentsBRL } from "@/lib/utils";

export function withdrawalApprovedEmail(input: {
  adminName?: string;
  clientName: string;
  productName: string;
  refundCents: number;
  feeCents: number;
  totalCents: number;
  pixKey: string;
  payoutStatus: string;
  requestId: string;
}) {
  const base = appBaseUrl();
  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:24px;letter-spacing:-0.02em;">Saque aprovado</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#5c5c66;">
      Olá${input.adminName ? ` ${input.adminName}` : ""}, um saque de aportes foi
      <strong style="color:#111">aprovado</strong> no Financeiro.
    </p>
    <div style="margin:16px 0;padding:16px 18px;background:#f7f7f8;border-radius:16px;font-size:14px;line-height:1.6;color:#111;">
      <div><strong>Cliente:</strong> ${input.clientName}</div>
      <div><strong>Produto:</strong> ${input.productName}</div>
      <div><strong>Total aportes:</strong> ${formatCentsBRL(input.totalCents)}</div>
      <div><strong>Taxa (30%):</strong> ${formatCentsBRL(input.feeCents)}</div>
      <div><strong>A receber (70%):</strong> ${formatCentsBRL(input.refundCents)}</div>
      <div><strong>Chave Pix:</strong> ${input.pixKey}</div>
      <div><strong>Status do Pix:</strong> ${input.payoutStatus}</div>
      <div><strong>ID:</strong> ${input.requestId}</div>
    </div>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#5c5c66;">
      O Pix de payout foi enfileirado (ou aguarda gateway). O agente fará o acompanhamento.
    </p>
    ${ctaButton("Abrir Financeiro", `${base}/admin/financeiro`)}
  `;
  const text = [
    `Saque aprovado — ${input.clientName}`,
    `Produto: ${input.productName}`,
    `Reembolso: ${formatCentsBRL(input.refundCents)}`,
    `Pix: ${input.pixKey}`,
    `Payout: ${input.payoutStatus}`,
    `ID: ${input.requestId}`,
  ].join("\n");

  return {
    subject: `Saque aprovado · ${formatCentsBRL(input.refundCents)} · ${input.clientName}`,
    html: emailShell({
      title: "Saque aprovado",
      preheader: `Reembolso ${formatCentsBRL(input.refundCents)} enfileirado`,
      bodyHtml,
    }),
    text,
  };
}
