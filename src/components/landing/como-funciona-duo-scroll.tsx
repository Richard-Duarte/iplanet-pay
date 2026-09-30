"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import { MotionFade } from "@/components/ui/motion";
import {
  IphoneDuoScrollClient,
  useDuoDisplayOptions,
  type DuoSceneController,
} from "@/components/landing/iphone-duo-scroll-client";

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

const DESKTOP_MQ = "(min-width: 768px)";
const PHONE_SIZE_DESKTOP = 1.3;
const PHONE_SIZE_MOBILE = 1;
const DUO_SCREEN_BLUR = 0.55;

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

type StepRuntime = {
  phase: PinPhase;
  fold: number;
};

type SceneDriver = (
  fold: number,
  isVisible: boolean,
  phoneSize: number,
) => void;

function mapScrollToFold(t: number): number {
  if (t <= HOLD_CLOSED) return 0;
  if (t >= OPEN_END) return 1;
  const linear = (t - HOLD_CLOSED) / (OPEN_END - HOLD_CLOSED);
  return linear * linear * (3 - 2 * linear);
}

function computeStepRuntime(el: HTMLDivElement): StepRuntime {
  const rect = el.getBoundingClientRect();
  const viewport = window.innerHeight;
  const pinH = Math.max(1, viewport - PIN_TOP);
  const range = Math.max(1, rect.height - pinH);

  if (rect.top > PIN_TOP) {
    return { phase: "before", fold: 0 };
  }

  if (rect.bottom <= PIN_TOP + pinH) {
    return { phase: "after", fold: 1 };
  }

  const scrolled = Math.min(range, Math.max(0, PIN_TOP - rect.top));
  return {
    phase: "pinned",
    fold: mapScrollToFold(scrolled / range),
  };
}

function trackVisible(el: HTMLDivElement): boolean {
  const rect = el.getBoundingClientRect();
  const viewport = window.innerHeight;
  return rect.bottom > 0 && rect.top < viewport;
}

function phasesChanged(a: PinPhase[], b: PinPhase[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}

function useDesktopPhoneSize() {
  const [phoneSize, setPhoneSize] = useState(PHONE_SIZE_MOBILE);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => {
      setPhoneSize(mq.matches ? PHONE_SIZE_DESKTOP : PHONE_SIZE_MOBILE);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return phoneSize;
}

function useDuoScrollEngine(
  trackRefs: MutableRefObject<(HTMLDivElement | null)[]>,
  sceneDrivers: MutableRefObject<(SceneDriver | null)[]>,
  phoneSizeRef: MutableRefObject<number>,
) {
  const [phases, setPhases] = useState<PinPhase[]>(() =>
    STEPS.map(() => "before" as PinPhase),
  );

  useEffect(() => {
    let raf = 0;
    const ro = new ResizeObserver(() => schedule());
    const observed = new WeakSet<HTMLDivElement>();

    const attachObservers = () => {
      for (const el of trackRefs.current) {
        if (!el || observed.has(el)) continue;
        observed.add(el);
        ro.observe(el);
      }
    };

    const tick = () => {
      raf = 0;
      attachObservers();
      const nextPhases: PinPhase[] = [];
      const size = phoneSizeRef.current;

      trackRefs.current.forEach((el, index) => {
        if (!el) {
          nextPhases.push("before");
          return;
        }
        const runtime = computeStepRuntime(el);
        nextPhases.push(runtime.phase);
        const visible = trackVisible(el);
        const drive = sceneDrivers.current[index];
        drive?.(runtime.fold, visible, size);
      });

      setPhases((prev) =>
        phasesChanged(prev, nextPhases) ? nextPhases : prev,
      );
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [trackRefs, sceneDrivers, phoneSizeRef]);

  return phases;
}

const DuoPinnedStep = memo(function DuoPinnedStep({
  step,
  phase,
  phoneSize,
  trackRef,
  registerSceneDriver,
}: {
  step: (typeof STEPS)[number];
  phase: PinPhase;
  phoneSize: number;
  trackRef: (el: HTMLDivElement | null) => void;
  registerSceneDriver: (
    index: number,
    driver: SceneDriver | null,
  ) => void;
}) {
  const stepIndex = step.n - 1;
  const [mountDuo, setMountDuo] = useState(step.n === 1);
  const controllerRef = useRef<DuoSceneController | null>(null);
  const displayOptions = useDuoDisplayOptions({
    screen: "custom",
    innerImage: { src: step.inner },
    outerImage: { src: step.outer },
    imageFit: "cover",
    lockScreenUI: {
      showClock: false,
      showWifi: false,
      showQuickActions: false,
    },
  });

  useEffect(() => {
    const el = document.querySelector<HTMLDivElement>(
      `[data-duo-step="${step.n}"]`,
    );
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setMountDuo(true);
        else if (step.n > 1 && phase === "before") setMountDuo(false);
      },
      { rootMargin: "60% 0px 60% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phase, step.n]);

  const handleSceneReady = useCallback((controller: DuoSceneController) => {
    controllerRef.current = controller;
    registerSceneDriver(stepIndex, (fold, isVisible, size) => {
      controller.update(
        fold,
        size,
        displayOptions,
        DUO_SCREEN_BLUR,
        0,
        isVisible,
      );
    });
  }, [displayOptions, registerSceneDriver, stepIndex]);

  useEffect(() => {
    return () => registerSceneDriver(stepIndex, null);
  }, [registerSceneDriver, stepIndex]);

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
          contain: "layout style paint",
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
            contain: "layout style paint",
          }
        : {
            position: "relative",
            height: pinH,
            display: "grid",
            placeItems: "center",
            background: "#ffffff",
            contain: "layout style paint",
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
          style={{
            transform:
              phase === "before" ? undefined : `translateY(${VISUAL_LIFT})`,
          }}
        >
          {mountDuo ? (
            <IphoneDuoScrollClient
              foldProgress={0}
              interactionMode="scroll"
              reverseAnimation={false}
              phoneSize={phoneSize}
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
              screenBlur={DUO_SCREEN_BLUR}
              screenReflection={0}
              loaderColor="#858580"
              loaderOpacity={0.5}
              loaderStyle="fold"
              onSceneReady={handleSceneReady}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: "#ffffff" }}
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Three Framer iPhone Duo Scroll units (one per step).
 * Fixed pin: enter closed → centered → slow open → hold open → release.
 */
export function ComoFuncionaDuoScroll() {
  const phoneSize = useDesktopPhoneSize();
  const phoneSizeRef = useRef(phoneSize);
  phoneSizeRef.current = phoneSize;

  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sceneDrivers = useRef<(SceneDriver | null)[]>(
    STEPS.map(() => null),
  );

  const phases = useDuoScrollEngine(trackRefs, sceneDrivers, phoneSizeRef);

  const registerSceneDriver = useCallback(
    (index: number, driver: SceneDriver | null) => {
      sceneDrivers.current[index] = driver;
    },
    [],
  );

  const setTrackRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      trackRefs.current[index] = el;
    },
    [],
  );

  return (
    <section id="como-funciona-duo" className="relative bg-white text-[#111]">
      <div className="relative z-30 mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-8 md:pb-12 md:pt-24">
        <MotionFade>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Como funciona
          </p>
          <h2 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Três passos. Ritmo seu.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6e6e73] md:text-lg">
            Cada passo é um iPhone Duo: fechado mostra o número; role para abrir
            e ler o passo — escolha, aporte via Pix e retire na loja ou receba
            pelos correios em todo o Brasil.
          </p>
        </MotionFade>
      </div>

      {STEPS.map((step, index) => (
        <DuoPinnedStep
          key={step.n}
          step={step}
          phase={phases[index] ?? "before"}
          phoneSize={phoneSize}
          trackRef={setTrackRef(index)}
          registerSceneDriver={registerSceneDriver}
        />
      ))}
    </section>
  );
}
