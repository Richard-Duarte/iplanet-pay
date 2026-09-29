import { PageHeader } from "@/components/ui/page-header";
import { AdminUsedDevicePanel } from "@/components/trade-in/admin-used-device-panel";

export const metadata = { title: "Avaliação de usados" };

export default function AdminAvaliacaoUsadosPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Avaliação de usados"
        description="Fila de ofertas de aparelhos usados como pagamento."
      />
      <AdminUsedDevicePanel />
    </div>
  );
}
