import { appBaseUrl, ctaButton, emailShell } from "../layout";

export function confirmAccountEmail(opts: {
  fullName?: string;
  confirmUrl: string;
}) {
  const name = opts.fullName?.trim() || "olá";
  const body = `
    <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;letter-spacing:-0.02em;">Bem-vindo ao iPlanet Pay</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#5c5c66;">
      ${name}, confirme seu e-mail para reservar seu Apple e aportar via Pix no seu ritmo.
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#5c5c66;">
      Retire nas lojas iPlanet em <strong style="color:#111">Itaim Bibi</strong> ou
      <strong style="color:#111">São Caetano</strong>.
    </p>
    <p style="text-align:center;margin:24px 0;">${ctaButton("Confirmar e-mail", opts.confirmUrl)}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#5c5c66;line-height:1.5;">
      Se você não criou esta conta, ignore este e-mail. Por segurança, nunca compartilhe sua senha.
    </p>
    <p style="margin:12px 0 0;font-size:11px;color:#999;word-break:break-all;">
      Ou abra: ${opts.confirmUrl}
    </p>
  `;
  return {
    subject: "Confirme sua conta · iPlanet Pay",
    html: emailShell({
      title: "Confirme sua conta",
      preheader: "Confirme seu e-mail e comece sua reserva iPlanet Pay.",
      bodyHtml: body,
    }),
    text: `Bem-vindo ao iPlanet Pay. Confirme seu e-mail: ${opts.confirmUrl}`,
  };
}

export function welcomePostSignupEmail(opts: { fullName?: string }) {
  const name = opts.fullName?.trim() || "olá";
  const href = `${appBaseUrl()}/app/catalogo`;
  const body = `
    <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;letter-spacing:-0.02em;">Conta criada</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#5c5c66;">
      ${name}, sua conta iPlanet Pay está pronta. Escolha um produto e reserve na loja de sua preferência.
    </p>
    <p style="text-align:center;margin:24px 0;">${ctaButton("Ver catálogo", href)}</p>
  `;
  return {
    subject: "Sua conta iPlanet Pay está pronta",
    html: emailShell({
      title: "Conta criada",
      preheader: "Escolha seu Apple e comece a reservar.",
      bodyHtml: body,
    }),
    text: `Conta criada. Acesse o catálogo: ${href}`,
  };
}
