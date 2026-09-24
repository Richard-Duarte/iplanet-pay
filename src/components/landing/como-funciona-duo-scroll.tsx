"use client";

import { MotionFade } from "@/components/ui/motion";
import { IphoneDuoScrollClient } from "@/components/landing/iphone-duo-scroll-client";

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

/**
 * Variante B — three Framer iPhone Duo Scroll units (one per step).
 * Closed cover = step number; scroll unfolds = written step.
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
        <div key={step.n} className="w-full">
          <IphoneDuoScrollClient
            interactionMode="scroll"
            scrollLength={160}
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
        </div>
      ))}
    </section>
  );
}
