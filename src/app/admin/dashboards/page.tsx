import { PageHeader } from "@/components/ui/page-header";
import { DashboardsPanel } from "@/components/analytics/dashboards-panel";
import { getAnalyticsSummary } from "@/lib/analytics/queries";

export const metadata = { title: "Dashboards" };

export default async function AdminDashboardsPage() {
  const { summary, error } = await getAnalyticsSummary({ days: 30 });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Dashboards"
        description="Acessos, cliques, aportes e novos usuários — últimos 30 dias."
        backFallback="/admin"
        size="xl"
      />
      {error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      <DashboardsPanel summary={summary} />
    </div>
  );
}
