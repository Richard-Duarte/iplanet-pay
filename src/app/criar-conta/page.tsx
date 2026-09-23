import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { USE_MOCK_AUTH } from "@/lib/auth/mock";

export const metadata = { title: "Criar conta" };

export default async function CriarContaPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const ref = (params.ref ?? "").trim().toUpperCase();

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
          eyebrow="Comece agora"
          title="Criar conta"
          description="Reserve seu iPhone e pague no seu ritmo."
          size="md"
        />
        <Card className="mt-8">
          <SignupForm mockMode={USE_MOCK_AUTH} initialReferralCode={ref} />
        </Card>
      </div>
    </div>
  );
}
