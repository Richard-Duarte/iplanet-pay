import { PageHeader } from "@/components/ui/page-header";
import { confirmAccountEmail, welcomePostSignupEmail } from "@/lib/email/templates/confirm-account";
import { aporteConfirmadoEmail } from "@/lib/email/templates/aporte-confirmado";
import { aporteReminderEmail } from "@/lib/email/templates/aporte-reminder";
import { appBaseUrl } from "@/lib/email/layout";

export const metadata = { title: "Preview e-mails" };

export default async function EmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const sp = await searchParams;
  const template = sp.template ?? "confirm_account";

  const map: Record<string, { subject: string; html: string }> = {
    confirm_account: confirmAccountEmail({
      fullName: "Richard",
      confirmUrl: `${appBaseUrl()}/entrar`,
    }),
    welcome: welcomePostSignupEmail({ fullName: "Richard" }),
    aporte_confirmado: aporteConfirmadoEmail({
      fullName: "Richard",
      amountCents: 50000,
      productName: "iPhone 17",
      paidCents: 150000,
      listPriceCents: 799900,
      reservationId: "00000000-0000-0000-0000-000000000001",
    }),
    aporte_reminder: aporteReminderEmail({
      fullName: "Richard",
      productName: "iPhone 17",
      daysSince: 35,
      reservationId: "00000000-0000-0000-0000-000000000001",
      whatsappUrl: "https://wa.me/5511999999999",
    }),
  };

  const current = map[template] ?? map.confirm_account;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Preview de e-mails"
        description="QA visual dos templates transacionais (sem enviar)."
        backFallback="/admin/config"
      />
      <div className="flex flex-wrap gap-2">
        {Object.keys(map).map((k) => (
          <a
            key={k}
            href={`/admin/emails/preview?template=${k}`}
            className={
              k === template
                ? "rounded-full bg-[var(--ink)] px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-semibold"
            }
          >
            {k}
          </a>
        ))}
      </div>
      <p className="text-sm text-[var(--ink-muted)]">
        Assunto: <strong>{current.subject}</strong>
      </p>
      <iframe
        title="email-preview"
        className="min-h-[720px] w-full rounded-[24px] border border-[var(--line)] bg-white"
        srcDoc={current.html}
      />
    </div>
  );
}
