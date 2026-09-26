"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { pickWeightedWinner } from "@/lib/raffle/utils";
import { Sparkles } from "lucide-react";

export type RaffleDrawEntry = {
  userId: string;
  name: string;
  tickets: number;
};

export function RaffleDrawStage({
  entries,
  onComplete,
  drawing = false,
}: {
  entries: RaffleDrawEntry[];
  onComplete: (winner: { userId: string; name: string }) => void;
  drawing?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "spin" | "reveal">("idle");
  const [highlight, setHighlight] = useState(0);
  const [winner, setWinner] = useState<{ userId: string; name: string } | null>(
    null,
  );

  const pool = useMemo(
    () => entries.filter((e) => e.tickets > 0),
    [entries],
  );

  const expanded = useMemo(() => {
    const list: RaffleDrawEntry[] = [];
    for (const e of pool) {
      for (let i = 0; i < Math.min(e.tickets, 50); i++) list.push(e);
    }
    return list.length ? list : pool;
  }, [pool]);

  const runDraw = useCallback(() => {
    const w = pickWeightedWinner(entries);
    if (!w) return;
    if (reduceMotion) {
      setWinner(w);
      setPhase("reveal");
      onComplete(w);
      return;
    }
    setWinner(w);
    setPhase("spin");
    let ticks = 0;
    const maxTicks = 48 + Math.floor(Math.random() * 24);
    const interval = setInterval(() => {
      setHighlight((h) => (h + 1) % Math.max(expanded.length, 1));
      ticks += 1;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        setPhase("reveal");
        onComplete(w);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [entries, expanded.length, onComplete, reduceMotion]);

  useEffect(() => {
    if (drawing && phase === "idle") runDraw();
  }, [drawing, phase, runDraw]);

  const displayName =
    phase === "reveal" && winner
      ? winner.name
      : expanded[highlight]?.name ?? "—";

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0a0a12] via-[#12122a] to-[#1a0f2e] p-8 text-white shadow-[0_0_80px_rgba(120,80,255,0.25)]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[var(--accent)]"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 29) % 100}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
            transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>

      <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
        Sorteio iPlanet Pay
      </p>
      <motion.h2
        key={displayName}
        className="mt-6 text-center text-3xl font-black tracking-tight sm:text-5xl"
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        {displayName}
      </motion.h2>

      <AnimatePresence>
        {phase === "reveal" && winner ? (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-2 w-2 rounded-sm bg-gradient-to-br from-[var(--accent)] to-fuchsia-400"
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 420,
                  y: (Math.random() - 0.5) * 320,
                  opacity: 0,
                  rotate: Math.random() * 720,
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative mt-10 flex justify-center">
        <Button
          type="button"
          variant="accent"
          size="lg"
          disabled={phase === "spin" || pool.length === 0}
          leftIcon={<Sparkles className="h-5 w-5" />}
          onClick={() => runDraw()}
          className="min-w-[200px] shadow-[0_0_32px_rgba(120,80,255,0.45)]"
        >
          {phase === "spin" ? "Sorteando…" : "Sortear"}
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-white/45">
        {pool.reduce((s, e) => s + e.tickets, 0)} fichas no pool · peso por ficha
      </p>
    </div>
  );
}
