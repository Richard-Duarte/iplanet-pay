import { Package, Store } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { EstoquePanel } from "@/components/stock/estoque-panel";
import { listStockMatrix } from "@/lib/stock/queries";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Estoque · Parceiro" };

export default async function ParceiroEstoquePage() {
  const user = await getCurrentUser();
  const storeId = user?.store_id ?? null;

  if (!storeId) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Loja parceira"
          title="Estoque"
          description="Disponibilidade dos aparelhos na sua loja."
          size="lg"
        />
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title="Loja não vinculada"
          description="Sua conta de parceiro ainda não está associada a uma loja. Peça ao admin para vincular o store_id do seu perfil."
        />
      </div>
    );
  }

  const { stores, rows, error } = await listStockMatrix({
    storeId,
    includeInactive: true,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Loja parceira"
        title="Estoque"
        description={
          stores[0]
            ? `Ajuste a quantidade disponível em ${stores[0].name}.`
            : "Ajuste a quantidade disponível na sua loja."
        }
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
          lockStoreId={storeId}
        />
      )}
    </div>
  );
}
