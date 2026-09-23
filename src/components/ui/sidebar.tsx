"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Trophy,
  Users,
  Gift,
  BarChart3,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";

export type SidebarIcon =
  | "layout-dashboard"
  | "package"
  | "shopping-bag"
  | "users"
  | "store"
  | "settings"
  | "trophy"
  | "credit-card"
  | "clipboard-check"
  | "bookmark"
  | "gift"
  | "bar-chart"
  | "message-circle";

const icons: Record<SidebarIcon, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  package: Package,
  "shopping-bag": ShoppingBag,
  users: Users,
  store: Store,
  settings: Settings,
  trophy: Trophy,
  "credit-card": CreditCard,
  "clipboard-check": ClipboardCheck,
  bookmark: Bookmark,
  gift: Gift,
  "bar-chart": BarChart3,
  "message-circle": MessageCircle,
};

export interface SidebarItem {
  href: string;
  label: string;
  icon: SidebarIcon;
}

interface SidebarProps {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  footer?: React.ReactNode;
}

export function Sidebar({ title, subtitle, items, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-[var(--line)] bg-white p-6 lg:flex">
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <BrandLogo size={40} />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            iPlanet Pay
          </p>
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon }) => {
          const Icon = icons[icon];
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="mt-6 border-t border-[var(--line)] pt-6">{footer}</div> : null}
    </aside>
  );
}
