"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { RaffleDrawStage, type RaffleDrawEntry } from "@/components/admin/raffle-draw-stage";
import { Pill } from "@/components/ui/pill";

export function SorteioAdminClient({ entries }: { entries: RaffleDrawEntry[] }) {
  const [lastWinner, setLastWinner] = useState<{ userId: string; name: string } | null>(
    null,
  );

  async function persistWinner(w: { userId: string; name: string }) {
    setLastWinner(w);
    const entry = entries.find((e) => e.userId === w.userId);
    const pool = entries.reduce((s, e) => s + e.tickets, 0);
    try {
      await fetch("/api/admin/raffle/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner_user_id: w.userId,
          winner_name: w.name,
          winner_tickets: entry?.tickets ?? 0,
          total_tickets_pool: pool,
        }),
      });
    } catch {
      /* non-blocking for live show */
    }
  }

  return (
    <div className="space-y-8">
      <RaffleDrawStage entries={entries} onComplete={(w) => void persistWinner(w)} />

      {lastWinner ? (
        <Card className="text-center">
          <p className="text-sm text-[var(--ink-muted)]">Último sorteado</p>
          <p className="text-xl font-bold">{lastWinner.name}</p>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Ranking de fichas</h2>
        <ul className="divide-y divide-[var(--line)]">
          {entries.slice(0, 30).map((e, i) => (
            <li key={e.userId} className="flex items-center justify-between py-2 text-sm">
              <span>
                #{i + 1} {e.name}
              </span>
              <Pill tone="lavender">{e.tickets}</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
