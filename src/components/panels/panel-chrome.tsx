import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Store,
  Settings,
  Trophy,
  CreditCard,
  ClipboardCheck,
} from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { Pill } from "@/components/ui/pill";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";
import type { SidebarItem } from "@/components/ui/sidebar";

const NAV: Record<"parceiro" | "staff" | "admin", SidebarItem[]> = {
  parceiro: [
    { href: "/parceiro", label: "Visão geral", icon: LayoutDashboard },
    { href: "/parceiro#estoque", label: "Estoque", icon: Package },
    { href: "/parceiro#pedidos", label: "Pedidos", icon: ShoppingBag },
  ],
  staff: [
    { href: "/staff", label: "Visão geral", icon: LayoutDashboard },
    { href: "/staff#clientes", label: "Clientes", icon: Users },
    { href: "/staff#estoque", label: "Estoque", icon: Package },
    { href: "/staff#avaliacoes", label: "Avaliações", icon: ClipboardCheck },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin#financeiro", label: "Financeiro", icon: CreditCard },
    { href: "/admin#lojas", label: "Lojas", icon: Store },
    { href: "/admin#gateways", label: "Gateways", icon: Settings },
    { href: "/admin#sorteios", label: "Sorteios", icon: Trophy },
  ],
};

const TITLES = {
  parceiro: { title: "Parceiro", subtitle: "Loja · estoque e pedidos" },
  staff: { title: "Staff", subtitle: "Operação iPlanet" },
  admin: { title: "Admin", subtitle: "Controle da plataforma" },
} as const;

export async function PanelChrome({
  role,
  children,
}: {
  role: Exclude<UserRole, "cliente">;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/${role}`);
  if (user.role !== role && user.role !== "admin") {
    redirect("/entrar");
  }

  const meta = TITLES[role];

  return (
    <AppShell
      variant="painel"
      sidebarTitle={meta.title}
      sidebarSubtitle={meta.subtitle}
      sidebarItems={NAV[role]}
      sidebarFooter={
        <div className="space-y-3">
          <p className="text-sm font-semibold">{user.full_name}</p>
          <Pill tone="accent">{user.role}</Pill>
          <LogoutButton />
        </div>
      }
      topBar={
        <div className="flex items-center justify-between lg:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              iPlanet Pay
            </p>
            <p className="text-lg font-bold">{meta.title}</p>
          </div>
          <LogoutButton />
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
