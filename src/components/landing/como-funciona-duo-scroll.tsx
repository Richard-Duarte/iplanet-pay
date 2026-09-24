"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MotionFade } from "@/components/ui/motion";
import { IphoneDuoScrollClient } from "@/components/landing/iphone-duo-scroll-client";

/** Sticky runway height (vh). Phone stays pinned while foldProgress 0→1. */
const PIN_VH = 140;
/** Site header offset so the phone centers in the remaining viewport. */
const HEADER_PX = 64;
/**
 * Scroll progress inside the pin runway (tuned short so open starts ASAP once centered):
 * 0–holdClosed: brief closed hold
 * holdClosed–openEnd: unfold
 * openEnd–1: hold open readable, then release
 */
const HOLD_CLOSED = 0.02;
const OPEN_END = 0.38;

const STEPS = [
  {
    n: 1,
    outer: "/images/duo-scroll/step-1-outer.png",
    inner: "/images/duo-scroll/step-1-inner.png",
  },
  {
    n: 2,
    outer: "/images/duo-scroll/step-2-outer.png",
    inner: "/images/duo-scroll/step-2-inner.png",
  },
  {
    n: 3,
    outer: "/images/duo-scroll/step-3-outer.png",
    inner: "/images/duo-scroll/step-3-inner.png",
  },
] as const;

function mapScrollToFold(t: number): number {
  if (t <= HOLD_CLOSED) return 0;
  if (t >= OPEN_END) return 1;
  return (t - HOLD_CLOSED) / (OPEN_END - HOLD_CLOSED);
}

function DuoPinnedStep({
  step,
}: {
  step: (typeof STEPS)[number];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [foldProgress, setFoldProgress] = useState(0);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewport = window.innerHeight;
    // Sticky engages once track top hits HEADER_PX; progress = how far we've
    // scrolled through (trackHeight - stickyViewport).
    const stickyH = Math.max(1, viewport - HEADER_PX);
    const range = Math.max(1, rect.height - stickyH);
    const scrolled = Math.max(0, Math.min(range, HEADER_PX - rect.top));
    const t = scrolled / range;
    setFoldProgress(mapScrollToFold(t));
  }, []);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [update]);

  const trackStyle: CSSProperties = {
    height: `${PIN_VH}vh`,
    position: "relative",
    width: "100%",
  };

  const pinStyle: CSSProperties = {
    position: "sticky",
    top: HEADER_PX,
    height: `calc(100vh - ${HEADER_PX}px)`,
    width: "100%",
    display: "grid",
    placeItems: "center",
    overflow: "visible",
    background: "#ffffff",
  };

  return (
    <div
      ref={trackRef}
      className="w-full"
      data-duo-step={step.n}
      style={trackStyle}
    >
      <div style={pinStyle}>
        <div className="h-full w-full">
          <IphoneDuoScrollClient
            foldProgress={foldProgress}
            interactionMode="scroll"
            reverseAnimation={false}
            phoneSize={1}
            phoneFinish="star-white"
            background="#ffffff"
            screen="custom"
            imageFit="cover"
            outerImage={{ src: step.outer }}
            innerImage={{ src: step.inner }}
            lockScreenUI={{
              showClock: false,
              showWifi: false,
              showQuickActions: false,
            }}
            screenBlur={1}
            screenReflection={0}
            loaderColor="#858580"
            loaderOpacity={0.5}
            loaderStyle="fold"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Variante B — three Framer iPhone Duo Scroll units (one per step).
 * Parent owns sticky pin: enter closed → hold centered → unfold → hold open → release.
 * Outer (right when open) keeps the step number; inner (left) shows written copy.
 * All three stay mounted so WebGL contexts stay valid.
 */
export function ComoFuncionaDuoScroll() {
  return (
    <section id="como-funciona-duo" className="relative bg-white text-[#111]">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-16 md:px-8 md:pt-24">
        <MotionFade>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Variante B · iPhone Duo Scroll
          </p>
          <h2 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Três passos. Ritmo seu.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6e6e73] md:text-lg">
            Cada passo é um iPhone Duo: fechado mostra o número; role para abrir
            e ler o passo. Compare com a variante A em{" "}
            <a
              href="#como-funciona"
              className="font-medium text-[#111] underline decoration-black/20 underline-offset-4 hover:decoration-black/60"
            >
              #como-funciona
            </a>
            .
          </p>
        </MotionFade>
      </div>

      {STEPS.map((step) => (
        <DuoPinnedStep key={step.n} step={step} />
      ))}
    </section>
  );
}
