import { appBaseUrl, ctaButton, emailShell } from "../layout";

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function aporteConfirmadoEmail(opts: {
  fullName?: string;
  amountCents: number;
  productName: string;
  paidCents: number;
  listPriceCents: number;
  reservationId: string;
}) {
  const name = opts.fullName?.trim() || "olá";
  const pct = Math.min(
    100,
    Math.round((opts.paidCents / Math.max(opts.listPriceCents, 1)) * 100),
  );
  const href = `${appBaseUrl()}/app/reserva/${opts.reservationId}`;
  const body = `
    <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;letter-spacing:-0.02em;">Aporte confirmado 🎉</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#5c5c66;">
      ${name}, recebemos <strong style="color:#111">${brl(opts.amountCents)}</strong> para
      <strong style="color:#111">${opts.productName}</strong>.
    </p>
    <div style="margin:20px 0;padding:16px 18px;background:#f7f7f8;border-radius:16px;">
      <p style="margin:0;font-size:13px;color:#5c5c66;">Progresso da reserva</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;">${pct}%</p>
      <p style="margin:4px 0 0;font-size:13px;color:#5c5c66;">
        ${brl(opts.paidCents)} de ${brl(opts.listPriceCents)}
      </p>
      <div style="margin-top:10px;height:8px;background:#e8e8ec;border-radius:999px;overflow:hidden;">
        <div style="height:8px;width:${pct}%;background:#0071e3;border-radius:999px;"></div>
      </div>
    </div>
    <p style="text-align:center;margin:24px 0;">${ctaButton("Ver minha reserva", href)}</p>
  `;
  return {
    subject: `Aporte de ${brl(opts.amountCents)} confirmado · iPlanet Pay`,
    html: emailShell({
      title: "Aporte confirmado",
      preheader: `Seu aporte de ${brl(opts.amountCents)} foi confirmado.`,
      bodyHtml: body,
    }),
    text: `Aporte confirmado: ${brl(opts.amountCents)} em ${opts.productName}. Progresso ${pct}%. ${href}`,
  };
}
