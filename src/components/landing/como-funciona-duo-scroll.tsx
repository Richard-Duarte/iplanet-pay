"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MotionFade } from "@/components/ui/motion";
import { IphoneDuoScrollClient } from "@/components/landing/iphone-duo-scroll-client";

/** Sticky travel while pinned (vh). Longer = slower open + more hold time. */
const SCROLL_LENGTH = 320;

const STEPS = [
  {
    n: 1,
    title: "Escolha",
    body: "Toque no produto e veja detalhes e defina uma meta.",
    outer: "/images/duo-scroll/step-1-outer.png",
    inner: "/images/duo-scroll/step-1-inner.png",
  },
  {
    n: 2,
    title: "Aporte via Pix",
    body: "Entre, reserve e pague aos poucos sem juros.",
    outer: "/images/duo-scroll/step-2-outer.png",
    inner: "/images/duo-scroll/step-2-inner.png",
  },
  {
    n: 3,
    title: "Retire",
    body: "Com a reserva quitada, retire na loja iPlanet.",
    outer: "/images/duo-scroll/step-3-outer.png",
    inner: "/images/duo-scroll/step-3-inner.png",
  },
] as const;

type Step = (typeof STEPS)[number];

type DuoActiveCtx = {
  active: number | null;
  report: (n: number, ratio: number, intersecting: boolean) => void;
};

const DuoActiveContext = createContext<DuoActiveCtx | null>(null);

function DuoActiveProvider({ children }: { children: ReactNode }) {
  const ratios = useRef<Map<number, number>>(new Map());
  const [active, setActive] = useState<number | null>(1);

  const report = useCallback(
    (n: number, ratio: number, intersecting: boolean) => {
      if (!intersecting || ratio <= 0) ratios.current.delete(n);
      else ratios.current.set(n, ratio);
      let best: number | null = null;
      let bestRatio = -1;
      for (const [id, r] of ratios.current) {
        if (r > bestRatio) {
          bestRatio = r;
          best = id;
        }
      }
      setActive((prev) => (prev === best ? prev : best));
    },
    [],
  );

  const value = useMemo(() => ({ active, report }), [active, report]);

  return (
    <DuoActiveContext.Provider value={value}>
      {children}
    </DuoActiveContext.Provider>
  );
}

function DuoStep({ step }: { step: Step }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ctx = useContext(DuoActiveContext);
  const isActive = ctx?.active === step.n;
  const report = ctx?.report;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !report) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        report(step.n, entry.intersectionRatio, entry.isIntersecting);
      },
      {
        root: null,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      report(step.n, 0, false);
    };
  }, [report, step.n]);

  return (
    <div ref={rootRef} className="w-full" data-duo-step={step.n}>
      {isActive ? (
        <IphoneDuoScrollClient
          interactionMode="scroll"
          scrollLength={SCROLL_LENGTH}
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
          style={{ width: "100%" }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: "100%",
            height: `${100 + SCROLL_LENGTH}vh`,
            background: "#ffffff",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              height: "100vh",
              display: "grid",
              placeItems: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.outer}
              alt=""
              width={220}
              height={320}
              style={{
                width: "min(42vw, 220px)",
                height: "auto",
                borderRadius: 28,
                boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Variante B — three Framer iPhone Duo Scroll units (one per step).
 * Sticky pin: enter closed → hold centered → unfold → hold open with copy → release.
 * Vendor progress band: ~18% closed hold, open until ~58%, then hold fully open (~42%).
 * Only one WebGL Duo mounts at a time (avoids context loss).
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

      <DuoActiveProvider>
        {STEPS.map((step) => (
          <DuoStep key={step.n} step={step} />
        ))}
      </DuoActiveProvider>
    </section>
  );
}
