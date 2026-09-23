"use client";

import { useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { Pill } from "@/components/ui/pill";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { SidebarItem } from "@/components/ui/sidebar";

const ADMIN_NAV: SidebarItem[] = [
  { href: "/admin", label: "Overview", icon: "layout-dashboard" },
  { href: "/admin/dashboards", label: "Dashboards", icon: "bar-chart" },
  { href: "/admin/reservas", label: "Reservas", icon: "bookmark" },
  { href: "/admin/clientes", label: "Clientes", icon: "users" },
  { href: "/admin/produtos", label: "Produtos", icon: "package" },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: "message-circle" },
  { href: "/admin/financeiro", label: "Financeiro", icon: "credit-card" },
  { href: "/admin/config", label: "Config", icon: "settings" },
  { href: "/admin/indicacoes", label: "Indicações", icon: "gift" },
];

/**
 * Client wrapper so mobile drawer state works.
 * Auth gate lives in AdminPanelChrome (server).
 */
export function PanelChromeClient({
  title,
  subtitle,
  userName,
  userRole,
  children,
}: {
  title: string;
  subtitle: string;
  userName: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AppShell
      variant="painel"
      sidebarTitle={title}
      sidebarSubtitle={subtitle}
      sidebarItems={ADMIN_NAV}
      mobileMenuOpen={menuOpen}
      onMobileMenuOpenChange={setMenuOpen}
      sidebarFooter={
        <div className="space-y-3">
          <p className="text-sm font-semibold">{userName}</p>
          <Pill tone="accent">{userRole}</Pill>
          <LogoutButton />
        </div>
      }
      topBar={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SidebarMenuButton
              open={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            />
            <BrandLogo size={32} className="lg:hidden" />
            <div className="lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                iPlanet Pay
              </p>
              <p className="text-lg font-bold">{title}</p>
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
