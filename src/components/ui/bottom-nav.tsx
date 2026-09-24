"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Smartphone, Wallet, UserRound, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/catalogo", label: "Catálogo", icon: Smartphone },
  { href: "/app/carteira", label: "Carteira", icon: Wallet },
  { href: "/app/indicacoes", label: "Indicações", icon: Gift },
  { href: "/app/configuracoes", label: "Conta", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium leading-tight sm:text-[11px]",
                  active ? "text-[var(--accent)]" : "text-[var(--ink-muted)]",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
