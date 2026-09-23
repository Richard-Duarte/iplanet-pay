import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/lib/auth/session";
import { Pill } from "@/components/ui/pill";
import { BrandLogo } from "@/components/ui/brand-logo";
import { BackButton } from "@/components/ui/back-button";

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
            <BackButton fallbackHref="/app" />
            <BrandLogo size={36} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-[var(--ink-muted)]">Olá,</p>
              <p className="truncate text-base font-bold tracking-tight sm:text-lg">
                {user.full_name}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden sm:inline-flex">
              <Pill tone="accent">{user.role}</Pill>
            </span>
            <LogoutButton />
          </div>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
