import { Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { EstoquePanel } from "@/components/stock/estoque-panel";
import { listStockMatrix } from "@/lib/stock/queries";

export const metadata = { title: "Estoque · Staff" };

export default async function StaffEstoquePage() {
  const { stores, rows, error } = await listStockMatrix({
    includeInactive: true,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação"
        title="Estoque"
        description="Ajuste de quantidade por loja (sem ativar/desativar produto)."
        size="lg"
      />

      {error ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Não foi possível carregar"
          description={error}
        />
      ) : (
        <EstoquePanel
          stores={stores}
          rows={rows}
          canEdit
          canToggleActive={false}
        />
      )}
    </div>
  );
}
