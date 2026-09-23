import { OpsReservasPageBody } from "@/components/reservations/ops-reservas-page";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Reservas · Parceiro" };

export default async function ParceiroReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; store?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/parceiro/reservas");

  // Filtra pela loja do parceiro quando store_id estiver definido.
  const lockStoreId =
    user.role === "parceiro" ? (user.store_id ?? null) : null;

  return (
    <OpsReservasPageBody
      eyebrow="Parceiro"
      title="Reservas da loja"
      description={
        lockStoreId
          ? "Reservas vinculadas à sua loja. Confirme retiradas das quitadas."
          : "Todas as reservas (parceiro sem loja vinculada)."
      }
      searchParams={searchParams}
      lockStoreId={lockStoreId}
    />
  );
}
