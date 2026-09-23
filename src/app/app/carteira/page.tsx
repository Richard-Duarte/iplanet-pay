import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet } from "lucide-react";

export const metadata = { title: "Carteira" };

export default function CarteiraPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Financeiro"
        title="Carteira"
        description="Saldo, histórico de Pix e créditos — módulo futuro."
      />
      <EmptyState
        icon={<Wallet className="h-6 w-6" />}
        title="Carteira em construção"
        description="TODO: saldo interno, extrato de aportes e reembolsos. Sem fluxos financeiros inventados nesta fase."
      />
    </div>
  );
}
