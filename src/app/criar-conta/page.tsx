import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/ui/brand-logo";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export const metadata = { title: "Criar conta" };

export default async function CriarContaPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; product?: string }>;
}) {
  const params = await searchParams;
  const ref = (params.ref ?? "").trim().toUpperCase();
  const product = params.product;

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo size={40} />
          <p className="text-sm font-bold">iPlanet Pay</p>
        </div>
        <PageHeader
          eyebrow="Comece agora"
          title="Criar conta"
          description="Reserve seu Apple e pague no seu ritmo."
          size="md"
          showBack
          backFallback="/"
        />
        <Card className="mt-8">
          <SignupForm
            mockMode={USE_MOCK_AUTH}
            initialReferralCode={ref}
            productSlug={product}
          />
        </Card>
        <p className="mt-4 text-center text-sm text-[var(--ink-muted)]">
          Já tem conta?{" "}
          <Link
            href={product ? `/entrar?product=${encodeURIComponent(product)}` : "/entrar"}
            className="font-semibold text-[var(--ink)]"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
