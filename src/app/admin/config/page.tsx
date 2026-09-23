import { PageHeader } from "@/components/ui/page-header";
import { GatewayStatusPanel } from "@/components/admin/gateway-status";
import {
  ReferralSettingsForm,
  SupportAndAgentSettingsForm,
} from "@/components/admin/settings-form";
import { getAppSettings } from "@/lib/settings/queries";

export const metadata = { title: "Configurações" };

export default async function AdminConfigPage() {
  const { settings } = await getAppSettings([
    "referral_bonus_amount_cents",
    "whatsapp_support",
    "agent_enabled",
    "whatsapp_admin",
  ]);

  const whatsappAdminConfigured = Boolean(
    (settings.whatsapp_admin ?? "").trim() ||
      process.env.WHATSAPP_TOKEN?.trim(),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Configurações"
        description="Gateways, WhatsApp (suporte + admin AI) e indicação."
        size="xl"
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <GatewayStatusPanel />
        <ReferralSettingsForm
          initialBonusCents={settings.referral_bonus_amount_cents ?? "5000"}
        />
      </section>

      <section>
        <SupportAndAgentSettingsForm
          initialWhatsapp={settings.whatsapp_support ?? ""}
          initialWhatsappAdmin={settings.whatsapp_admin ?? ""}
          initialAgentEnabled={settings.agent_enabled === "true"}
          whatsappAdminConfigured={whatsappAdminConfigured}
        />
      </section>
    </div>
  );
}
