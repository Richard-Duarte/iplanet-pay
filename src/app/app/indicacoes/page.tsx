import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Gift } from "lucide-react";

export const metadata = { title: "Indicações" };

export default function IndicacoesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Programa"
        title="Indicações"
        description="Convide amigos e acompanhe recompensas."
      />
      <EmptyState
        icon={<Gift className="h-6 w-6" />}
        title="Indicações em breve"
        description="TODO: código de indicação, tracking e crédito de bônus."
      />
    </div>
  );
}
