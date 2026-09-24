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

/**
 * Scroll runway while the phone is pinned in the viewport (vh).
 * Longer = slower unfold. Pin uses position:fixed (Lenis-safe).
 */
const PIN_VH = 145;
/** Sticky landing header ~56–64px; keep a thin clearance so closed portrait isn’t clipped. */
const PIN_TOP = 48;
/**
 * Optical lift: open landscape Duo reads low when truly centered in the
 * leftover viewport — nudge up so it sits in the visual middle.
 */
const VISUAL_LIFT = "-9vh";
/**
 * 0–holdClosed: closed, centered
 * holdClosed–openEnd: smooth unfold (still centered)
 * openEnd–1: fully open & readable, then release
 */
const HOLD_CLOSED = 0.08;
const OPEN_END = 0.78;

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

type PinPhase = "before" | "pinned" | "after";

function mapScrollToFold(t: number): number {
  if (t <= HOLD_CLOSED) return 0;
  if (t >= OPEN_END) return 1;
  const linear = (t - HOLD_CLOSED) / (OPEN_END - HOLD_CLOSED);
  // Smoothstep — gentle open that finishes while still pinned
  return linear * linear * (3 - 2 * linear);
}

function DuoPinnedStep({
  step,
}: {
  step: (typeof STEPS)[number];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [foldProgress, setFoldProgress] = useState(0);
  const [phase, setPhase] = useState<PinPhase>("before");

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewport = window.innerHeight;
    const pinH = Math.max(1, viewport - PIN_TOP);
    const range = Math.max(1, rect.height - pinH);

    // before: track hasn't reached the pin line yet
    if (rect.top > PIN_TOP) {
      setPhase("before");
      setFoldProgress(0);
      return;
    }

    // after: scrolled past the pin window — park phone at end of track
    if (rect.bottom <= PIN_TOP + pinH) {
      setPhase("after");
      setFoldProgress(1);
      return;
    }

    // pinned: keep phone fixed & centered; map scroll → fold
    setPhase("pinned");
    const scrolled = Math.min(range, Math.max(0, PIN_TOP - rect.top));
    setFoldProgress(mapScrollToFold(scrolled / range));
  }, []);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          update();
        });
      }
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

  const pinH = `calc(100vh - ${PIN_TOP}px)`;

  const stageStyle: CSSProperties =
    phase === "pinned"
      ? {
          position: "fixed",
          top: PIN_TOP,
          left: 0,
          right: 0,
          height: pinH,
          zIndex: 20 + step.n,
          display: "grid",
          placeItems: "center",
          background: "#ffffff",
        }
      : phase === "after"
        ? {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: pinH,
            display: "grid",
            placeItems: "center",
            background: "#ffffff",
          }
        : {
            position: "relative",
            height: pinH,
            display: "grid",
            placeItems: "center",
            background: "#ffffff",
          };

  return (
    <div
      ref={trackRef}
      className="relative w-full"
      data-duo-step={step.n}
      style={{ height: `${PIN_VH}vh` }}
    >
      <div style={stageStyle}>
        <div
          className="h-full w-full"
          style={{ transform: `translateY(${VISUAL_LIFT})` }}
        >
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
 * Three Framer iPhone Duo Scroll units (one per step).
 * Fixed pin: enter closed → centered → slow open → hold open → release.
 */
export function ComoFuncionaDuoScroll() {
  return (
    <section id="como-funciona-duo" className="relative bg-white text-[#111]">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-16 md:px-8 md:pt-24">
        <MotionFade>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Como funciona
          </p>
          <h2 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Três passos. Ritmo seu.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6e6e73] md:text-lg">
            Cada passo é um iPhone Duo: fechado mostra o número; role para abrir
            e ler o passo — escolha, aporte via Pix e retire na loja.
          </p>
        </MotionFade>
      </div>

      {STEPS.map((step) => (
        <DuoPinnedStep key={step.n} step={step} />
      ))}
    </section>
  );
}
