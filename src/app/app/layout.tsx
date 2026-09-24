import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/lib/auth/session";
import { BrandLogo } from "@/components/ui/brand-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/app");

  return (
    <AppShell
      variant="cliente"
      topBar={
        <div className="mb-6 flex min-w-0 items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogo variant="wordmark" height={44} className="shrink-0" />
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <p className="truncate text-base font-bold tracking-tight sm:text-lg">
                Olá, {user.full_name}
              </p>
              <UserAvatar
                name={user.full_name}
                avatarUrl={user.avatar_url}
                size={44}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/app/configuracoes">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
                aria-label="Configurações"
              >
                <span className="hidden sm:inline">Configurações</span>
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
