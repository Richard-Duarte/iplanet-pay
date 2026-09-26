"use client";

import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContributionList } from "@/components/wallet/contribution-list";
import type { Contribution } from "@/lib/wallet/types";
import { RequestSaqueButton } from "@/components/withdrawals/request-saque-button";
import { MotionModal } from "@/components/ui/motion";

export function ContributionHistoryPanel({
  contributions,
  showSaque,
  reservationId,
  totalPaidCents,
  emptyLabel = "Nenhum aporte nesta reserva ainda.",
}: {
  contributions: Contribution[];
  showSaque: boolean;
  reservationId: string;
  totalPaidCents: number;
  emptyLabel?: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ContributionList contributions={contributions} emptyLabel={emptyLabel} />
      </div>
      {showSaque ? (
        <div className="mt-4 flex justify-center border-t border-[var(--line)] pt-4">
          <RequestSaqueButton
            reservationId={reservationId}
            totalPaidCents={totalPaidCents}
            size="sm"
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <Card className="flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight">Histórico de aportes</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<Maximize2 className="h-4 w-4" />}
            onClick={() => setFullscreen(true)}
            aria-label="Abrir histórico em tela cheia"
          >
            Tela cheia
          </Button>
        </div>
        {body}
      </Card>

      <MotionModal
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        labelledBy="historico-fullscreen-title"
        className="max-w-3xl"
      >
        <div className="flex max-h-[92vh] flex-col px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="historico-fullscreen-title" className="text-lg font-bold">
              Histórico de aportes
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Minimize2 className="h-4 w-4" />}
              onClick={() => setFullscreen(false)}
            >
              Fechar
            </Button>
          </div>
          {body}
        </div>
      </MotionModal>
    </>
  );
}
