import type { ReactNode } from "react";
import { Sidebar, type SidebarItem } from "./sidebar";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: ReactNode;
  variant?: "cliente" | "painel";
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  sidebarItems?: SidebarItem[];
  sidebarFooter?: ReactNode;
  topBar?: ReactNode;
}

export function AppShell({
  children,
  variant = "cliente",
  sidebarTitle,
  sidebarSubtitle,
  sidebarItems = [],
  sidebarFooter,
  topBar,
}: AppShellProps) {
  if (variant === "cliente") {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-10">
          {topBar}
          {children}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-subtle)]">
      <Sidebar
        title={sidebarTitle ?? "Painel"}
        subtitle={sidebarSubtitle}
        items={sidebarItems}
        footer={sidebarFooter}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        {topBar ? (
          <div className="border-b border-[var(--line)] bg-white px-4 py-4 md:px-8">
            {topBar}
          </div>
        ) : null}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
