import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export const metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex text-sm font-semibold text-[var(--ink-muted)]"
        >
          ← Voltar
        </Link>
        <PageHeader
          eyebrow="Acesso"
          title="Entrar"
          description="Continue sua reserva ou gerencie a loja."
          size="md"
        />
        <Card className="mt-8">
          <LoginForm mockMode={USE_MOCK_AUTH} />
        </Card>
      </div>
    </div>
  );
}
