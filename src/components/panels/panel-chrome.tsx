import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { Pill } from "@/components/ui/pill";
import { BrandLogo } from "@/components/ui/brand-logo";
import { BackButton } from "@/components/ui/back-button";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";
import type { SidebarItem } from "@/components/ui/sidebar";

const NAV: Record<"parceiro" | "staff" | "admin", SidebarItem[]> = {
  parceiro: [
    { href: "/parceiro", label: "Visão geral", icon: "layout-dashboard" },
    { href: "/parceiro/reservas", label: "Reservas", icon: "bookmark" },
    { href: "/parceiro#pedidos", label: "Retiradas", icon: "shopping-bag" },
  ],
  staff: [
    { href: "/staff", label: "Visão geral", icon: "layout-dashboard" },
    { href: "/staff/reservas", label: "Reservas", icon: "bookmark" },
    { href: "/staff#retiradas", label: "Retiradas", icon: "package" },
    { href: "/staff/clientes", label: "Clientes", icon: "users" },
    { href: "/staff#avaliacoes", label: "Avaliações", icon: "clipboard-check" },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "layout-dashboard" },
    { href: "/admin/dashboards", label: "Dashboards", icon: "bar-chart" },
    { href: "/admin/reservas", label: "Reservas", icon: "bookmark" },
    { href: "/admin/clientes", label: "Clientes", icon: "users" },
    { href: "/admin/financeiro", label: "Financeiro", icon: "credit-card" },
    { href: "/admin/config", label: "Config", icon: "settings" },
    { href: "/admin/indicacoes", label: "Indicações", icon: "gift" },
    { href: "/admin#sorteios", label: "Sorteios", icon: "trophy" },
  ],
};

const TITLES = {
  parceiro: { title: "Parceiro", subtitle: "Loja · pedidos e retiradas" },
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref={`/${role}`} className="lg:hidden" />
            <BrandLogo size={32} className="lg:hidden" />
            <div className="lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                iPlanet Pay
              </p>
              <p className="text-lg font-bold">{meta.title}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
