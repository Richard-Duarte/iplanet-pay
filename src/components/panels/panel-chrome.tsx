import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PanelChromeClient } from "./panel-chrome-client";

/** Only admin panels remain. Parceiro/staff layouts redirect away. */
export async function PanelChrome({
  role,
  children,
}: {
  role: "admin" | "parceiro" | "staff";
  children: React.ReactNode;
}) {
  if (role !== "admin") {
    redirect("/entrar");
  }

  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/admin");
  if (user.role !== "admin") {
    redirect("/entrar");
  }

  return (
    <PanelChromeClient
      title="Admin"
      subtitle="Controle da plataforma"
      userName={user.full_name}
      userRole={user.role}
    >
      {children}
    </PanelChromeClient>
  );
}
