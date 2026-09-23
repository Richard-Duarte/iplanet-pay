import { OpsReservasPageBody } from "@/components/reservations/ops-reservas-page";

export const metadata = { title: "Reservas · Staff" };

export default function StaffReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; store?: string }>;
}) {
  return (
    <OpsReservasPageBody
      eyebrow="Operação"
      title="Reservas"
      description="Lista completa com busca, filtro por status/loja e ações inline."
      searchParams={searchParams}
    />
  );
}
