import { PageHeader } from "@/components/ui/page-header";
import { StoresAdmin } from "@/components/admin/stores-admin";
import { GatewayStatusPanel } from "@/components/admin/gateway-status";
import {
  ReferralSettingsForm,
  SupportAndAgentSettingsForm,
} from "@/components/admin/settings-form";
import { listStores } from "@/lib/stores/queries";
import { getAppSettings } from "@/lib/settings/queries";

export const metadata = { title: "Configurações" };

export default async function AdminConfigPage() {
  const [{ stores }, { settings }] = await Promise.all([
    listStores(),
    getAppSettings([
      "referral_bonus_amount_cents",
      "whatsapp_support",
      "agent_enabled",
    ]),
  ]);

  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Configurações"
        description="Lojas, gateways, WhatsApp, agente e indicação."
        size="xl"
        backFallback="/admin"
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Lojas</h2>
        <StoresAdmin stores={stores} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <GatewayStatusPanel />
        <ReferralSettingsForm
          initialBonusCents={settings.referral_bonus_amount_cents ?? "5000"}
        />
      </section>

      <section>
        <SupportAndAgentSettingsForm
          initialWhatsapp={settings.whatsapp_support ?? ""}
          initialAgentEnabled={settings.agent_enabled === "true"}
          telegramConfigured={telegramConfigured}
        />
      </section>
    </div>
  );
}
