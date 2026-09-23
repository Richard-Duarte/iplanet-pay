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
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/app" />
            <BrandLogo size={36} />
            <div>
              <p className="text-sm text-[var(--ink-muted)]">Olá,</p>
              <p className="text-lg font-bold tracking-tight">{user.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="accent">{user.role}</Pill>
            <LogoutButton />
          </div>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
