"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Trophy,
  Users,
  Gift,
  BarChart3,
  MessageCircle,
  X,
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
  /** Controlled mobile drawer (panel chrome) */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: SidebarItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map(({ href, label, icon }) => {
        const Icon = icons[icon];
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              active
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink)]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  title,
  subtitle,
  items,
  footer,
  mobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = mobileOpen ?? internalOpen;
  const setOpen = onMobileOpenChange ?? setInternalOpen;
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const brand = (
    <div className="mb-8">
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
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-[var(--line)] bg-white p-6 lg:flex">
        {brand}
        <NavLinks items={items} />
        {footer ? (
          <div className="mt-6 border-t border-[var(--line)] pt-6">{footer}</div>
        ) : null}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col overflow-y-auto border-r border-[var(--line)] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Menu
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)]"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {brand}
            <NavLinks items={items} onNavigate={() => setOpen(false)} />
            {footer ? (
              <div className="mt-6 border-t border-[var(--line)] pt-6">
                {footer}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}

export function SidebarMenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-white lg:hidden"
      aria-expanded={open}
      aria-label={open ? "Fechar menu" : "Abrir menu"}
    >
      {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
}
