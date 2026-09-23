export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3000"
  );
}

export function logoUrl() {
  return `${appBaseUrl()}/logo-iplanet.png`;
}

export function emailShell(opts: {
  title: string;
  preheader?: string;
  bodyHtml: string;
}) {
  const logo = logoUrl();
  const pre = opts.preheader ?? "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${pre}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(17,17,17,0.06);">
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              <img src="${logo}" width="56" height="56" alt="iPlanet" style="border-radius:14px;display:inline-block;" />
              <p style="margin:12px 0 0;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#FF6A00;">iPlanet Pay</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e8e8ec;text-align:center;">
              <p style="margin:0;font-size:12px;color:#5c5c66;line-height:1.5;">
                Lojas: Itaim Bibi · São Caetano do Sul<br/>
                iPlanet Pay · layaway inteligente
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ctaButton(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:#FF6A00;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">${label}</a>`;
}
