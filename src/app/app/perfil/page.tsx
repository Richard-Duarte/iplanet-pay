import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
import { redirect } from "next/navigation";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Conta"
        title="Perfil"
        description="Seus dados e preferências."
      />
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-[var(--ink-muted)]">Nome</p>
          <p className="text-xl font-bold tracking-tight">{user.full_name}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--ink-muted)]">E-mail</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--ink-muted)]">Telefone</p>
          <p className="font-medium">{user.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--ink-muted)]">Papel</p>
          <p className="font-medium capitalize">{user.role}</p>
        </div>
        <Link href="/app/reservas">
          <Button variant="outline" size="md">Minhas reservas</Button>
        </Link>
        <LogoutButton variant="outline" size="md" />
      </Card>
    </div>
  );
}
