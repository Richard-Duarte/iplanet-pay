import { OpsReservasPageBody } from "@/components/reservations/ops-reservas-page";
import { PickupRequestsPanel } from "@/components/admin/pickup-requests-panel";

export const metadata = { title: "Reservas · Admin" };

export default function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; store?: string }>;
}) {
  return (
    <>
      <OpsReservasPageBody
        eyebrow="Admin"
        title="Reservas"
        description="Busque por cliente, produto ou ID. Cancele ativas e confirme retiradas."
        searchParams={searchParams}
      />
      <div className="mt-8">
        <PickupRequestsPanel />
      </div>
    </>
  );
}
