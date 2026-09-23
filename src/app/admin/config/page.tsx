import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StoresAdmin } from "@/components/admin/stores-admin";
import { GatewayStatusPanel } from "@/components/admin/gateway-status";
import { ReferralSettingsForm } from "@/components/admin/settings-form";
import { listStores } from "@/lib/stores/queries";
import { getAppSettings } from "@/lib/settings/queries";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Configurações" };

export default async function AdminConfigPage() {
  const [{ stores }, { settings }] = await Promise.all([
    listStores(),
    getAppSettings(["referral_bonus_amount_cents"]),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow="Admin"
          title="Configurações"
          description="Lojas, status de gateways (env) e parâmetros de indicação."
          size="xl"
        />
        <Link href="/admin">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Voltar
          </Button>
        </Link>
      </div>

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
    </div>
  );
}
