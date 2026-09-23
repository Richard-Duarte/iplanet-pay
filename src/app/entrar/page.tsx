import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/ui/brand-logo";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export const metadata = { title: "Entrar" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams?: Promise<{ product?: string; next?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const product = sp.product;
  const next = product
    ? `/app/catalogo?product=${encodeURIComponent(product)}`
    : sp.next;

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandLogo variant="wordmark" height={52} priority />
        </div>
        <PageHeader
          eyebrow="Acesso"
          title="Entrar"
          description="Continue sua reserva ou gerencie a loja."
          size="md"
          showBack
          backForceHref="/"
        />
        <Card className="mt-8">
          <LoginForm mockMode={USE_MOCK_AUTH} nextPath={next} productSlug={product} />
        </Card>
        <p className="mt-4 text-center text-sm text-[var(--ink-muted)]">
          Ainda não tem conta?{" "}
          <Link
            href={product ? `/criar-conta?product=${encodeURIComponent(product)}` : "/criar-conta"}
            className="font-semibold text-[var(--ink)]"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
