"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  animate,
  type PanInfo,
} from "framer-motion";
import { formatCentsBRL } from "@/lib/utils";
import type { Product } from "@/types/database";

const GAP = 28;
const AUTOPLAY_MS = 5000;

export function VelocityCatalogCarousel({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (p: Product) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [cardW, setCardW] = useState(340);
  const [viewportW, setViewportW] = useState(0);
  const [paused, setPaused] = useState(false);
  const x = useMotionValue(0);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const vw = el.clientWidth;
    setViewportW(vw);
    // Large cards that peek neighbors — Velocity spirit
    const next = Math.min(400, Math.max(260, Math.round(vw * 0.72)));
    setCardW(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const offsetFor = useCallback(
    (i: number) => {
      const center = viewportW / 2 - cardW / 2;
      return center - i * (cardW + GAP);
    },
    [viewportW, cardW],
  );

  useEffect(() => {
    if (!viewportW) return;
    const controls = animate(x, offsetFor(index), {
      type: "spring",
      stiffness: 260,
      damping: 32,
      mass: 0.85,
    });
    return () => controls.stop();
  }, [index, offsetFor, viewportW, x]);

  function goTo(i: number) {
    if (products.length === 0) return;
    const next =
      ((i % products.length) + products.length) % products.length;
    setIndex(next);
  }

  // Autoplay every 5s; pause while dragging; reset on index change
  useEffect(() => {
    if (products.length < 2 || paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [products.length, paused, index]);

  function onDragEnd(_: unknown, info: PanInfo) {
    setPaused(false);
    const threshold = cardW * 0.18;
    const velocity = info.velocity.x;
    let next = index;
    if (info.offset.x < -threshold || velocity < -400) next = index + 1;
    else if (info.offset.x > threshold || velocity > 400) next = index - 1;
    goTo(next);
  }

  if (products.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-[var(--ink-muted)]">
        Nenhum produto nesta categoria.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className="relative overflow-hidden py-4"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
        }}
      >
        <motion.div
          className="flex cursor-grab items-stretch active:cursor-grabbing"
          style={{ x, gap: GAP }}
          drag="x"
          dragConstraints={{
            left: offsetFor(products.length - 1) - 40,
            right: offsetFor(0) + 40,
          }}
          dragElastic={0.12}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerCancel={() => setPaused(false)}
          onDragStart={() => setPaused(true)}
          onDragEnd={onDragEnd}
        >
          {products.map((p, i) => {
            const dist = Math.abs(i - index);
            const scale = dist === 0 ? 1 : dist === 1 ? 0.9 : 0.82;
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.72 : 0.45;
            const z = 20 - dist;

            return (
              <motion.button
                key={p.id}
                type="button"
                onClick={() => {
                  if (i !== index) {
                    goTo(i);
                    return;
                  }
                  onSelect(p);
                }}
                animate={{ scale, opacity }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                style={{ width: cardW, zIndex: z }}
                className="relative shrink-0 overflow-hidden rounded-[32px] border border-white/80 bg-white text-left shadow-[0_20px_60px_rgba(17,17,17,0.12)] outline-none"
              >
                <div className="relative flex aspect-[1/1.05] items-center justify-center bg-gradient-to-b from-[#f4f4f6] to-white p-7">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={340}
                      height={340}
                      className="h-full w-auto max-h-[260px] object-contain mix-blend-multiply"
                      draggable={false}
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-full bg-[var(--line)]" />
                  )}
                  {dist === 0 ? (
                    <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_8px_24px_rgba(17,17,17,0.12)]">
                      Ver detalhes
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 px-6 pb-6 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                    {p.category ?? "Apple"}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-[var(--ink)] md:text-2xl">
                    {p.name}
                  </h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {[p.storage, p.color].filter(Boolean).join(" · ")}
                  </p>
                  <p className="pt-1 text-lg font-semibold text-[var(--ink)]">
                    {formatCentsBRL(p.list_price_cents)}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {products.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Ir para ${p.name}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-7 bg-[var(--ink)]"
                : "w-1.5 bg-[var(--ink)]/25 hover:bg-[var(--ink)]/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
