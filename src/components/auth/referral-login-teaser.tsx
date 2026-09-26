import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Gift } from "lucide-react";

export function ReferralLoginTeaser() {
  return (
    <Card className="mt-6 border-[var(--accent-soft)] bg-[var(--accent-soft)]/30">
      <div className="flex gap-3">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div className="text-sm text-[var(--ink-muted)]">
          <p className="font-semibold text-[var(--ink)]">Programa de indicação</p>
          <p className="mt-1">
            Ao entrar, compartilhe seu link. Quando o indicado confirmar{" "}
            <strong className="text-[var(--ink)]">R$ 100,00</strong> em aportes, você
            recebe o bônus e pode aplicar em uma reserva ativa.
          </p>
          <Link href="/criar-conta" className="mt-2 inline-block font-semibold text-[var(--accent)]">
            Criar conta para participar →
          </Link>
        </div>
      </div>
    </Card>
  );
}
