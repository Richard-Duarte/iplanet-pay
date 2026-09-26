import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { TERMS_OF_USE_PT, TERMS_VERSION } from "@/lib/withdrawals/types";

export const metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-subtle)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="Legal" title="Termos de uso" description={TERMS_VERSION} />
        <Card className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-muted)]">
          {TERMS_OF_USE_PT}
        </Card>
      </div>
    </div>
  );
}
