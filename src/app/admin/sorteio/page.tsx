import { PageHeader } from "@/components/ui/page-header";
import { SorteioAdminClient } from "@/components/admin/sorteio-admin-client";
import { getAporteRanking } from "@/lib/raffle/queries";

export const metadata = { title: "Sorteio" };

export default async function AdminSorteioPage() {
  const { rows, error } = await getAporteRanking(200);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Sorteio mensal"
        description="Ranking por fichas e sorteio ao vivo para mídia / Instagram."
      />
      {error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : (
        <SorteioAdminClient
          entries={rows.map((r) => ({
            userId: r.user_id,
            name: r.full_name,
            tickets: r.tickets,
          }))}
        />
      )}
    </div>
  );
}
