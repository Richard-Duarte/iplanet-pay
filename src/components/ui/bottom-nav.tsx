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
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
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
                  "flex flex-col items-center gap-1 px-1 py-3 text-[11px] font-medium",
                  active ? "text-[var(--accent)]" : "text-[var(--ink-muted)]",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
