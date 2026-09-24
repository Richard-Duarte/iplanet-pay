"use client";

import { MotionFade } from "@/components/ui/motion";
import { IphoneDuoScrollClient } from "@/components/landing/iphone-duo-scroll-client";

const INNER_SRC = "/images/duo-scroll/inner-screen.png";
const OUTER_SRC = "/images/duo-scroll/outer-screen.png";

/**
 * Variante B — Framer iPhone Duo Scroll (scroll-to-unfold).
 * Kept alongside `#como-funciona` for A/B comparison.
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
            Role para desdobrar o iPhone Duo — a mesma animação 3D do componente
            Framer, com telas iPlanet (Escolha · Aporte · Retire). Compare com a
            variante A em{" "}
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

      <div className="w-full">
        <IphoneDuoScrollClient
          interactionMode="scroll"
          scrollLength={180}
          reverseAnimation={false}
          phoneSize={1}
          phoneFinish="star-white"
          background="#ffffff"
          screen="custom"
          imageFit="cover"
          innerImage={{ src: INNER_SRC }}
          outerImage={{ src: OUTER_SRC }}
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
    </section>
  );
}
