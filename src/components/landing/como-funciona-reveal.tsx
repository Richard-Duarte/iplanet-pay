"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { TextRevealOnScroll } from "@/components/landing/text-reveal-on-scroll";
import { DeviceMockupStage } from "@/components/landing/device-mockup-stage";

const STEPS = [
  {
    n: "01",
    title: "Escolha",
    body: "Toque no produto e veja detalhes e defina uma meta.",
    tone: "light" as const,
  },
  {
    n: "02",
    title: "Aporte via Pix",
    body: "Entre, reserve e pague aos poucos sem juros.",
    tone: "soft" as const,
  },
  {
    n: "03",
    title: "Retire",
    body: "Com a reserva quitada, retire na loja iPlanet.",
    tone: "navy" as const,
  },
  {
    n: "04",
    title: "Seu iPhone, no seu ritmo",
    body: "Da escolha à retirada: iPlanet Pay une as lojas físicas ao Pix no seu tempo.",
    tone: "unboxing" as const,
  },
] as const;

function PanelShell({
  tone,
  children,
  left,
  fullBleedLeft,
}: {
  tone: (typeof STEPS)[number]["tone"];
  children: ReactNode;
  left?: ReactNode;
  fullBleedLeft?: boolean;
}) {
  const bg =
    tone === "light"
      ? "bg-gradient-to-b from-white via-[#f5f5f7] to-[#e8e8ec]"
      : tone === "soft"
        ? "bg-gradient-to-b from-white to-[#eef3fb]"
        : tone === "navy"
          ? "bg-gradient-to-b from-[#0b1a33] to-[#132844]"
          : "bg-black";

  const showUnboxing = tone === "unboxing";

  return (
    <div className={`relative flex h-[100dvh] w-full items-center ${bg}`}>
      {showUnboxing ? (
        <>
          <Image
            src="/images/iphone-18-pro-max-unboxing.png"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30"
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={`relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-16 md:gap-12 md:px-8 ${
          showUnboxing
            ? ""
            : fullBleedLeft
              ? "md:grid-cols-[1.15fr_0.85fr]"
              : "md:grid-cols-2"
        }`}
      >
        {left ? (
          <div className="order-2 flex justify-center md:order-1">{left}</div>
        ) : null}
        <div
          className={`order-1 md:order-2 ${showUnboxing ? "max-w-3xl" : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ComoFuncionaReveal() {
  return (
    <section id="como-funciona" className="relative bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-16 md:px-8 md:pt-20">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Como funciona
        </p>
        <h2 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Três passos. Ritmo seu.
        </h2>
      </div>

      {STEPS.map((step, idx) => {
        const isDark = step.tone === "navy" || step.tone === "unboxing";
        const muted = isDark ? "#6b7280" : "#9ca3af";
        const active = isDark ? "#ffffff" : "#111111";

        let left: ReactNode = null;
        let fullBleedLeft = false;
        if (idx === 0) {
          left = <DeviceMockupStage />;
          fullBleedLeft = true;
        } else if (step.tone !== "unboxing") {
          left = (
            <div
              className={`flex h-40 w-40 items-center justify-center rounded-[36px] text-5xl font-bold tracking-tight md:h-56 md:w-56 md:text-7xl ${
                isDark
                  ? "bg-white/10 text-white/90"
                  : "bg-white text-[var(--accent)] shadow-[0_24px_60px_rgba(17,17,17,0.08)]"
              }`}
            >
              {step.n}
            </div>
          );
        }

        return (
          <div key={step.n} className="relative h-[140vh]">
            <div className="sticky top-0 h-[100dvh] overflow-hidden">
              <PanelShell
                tone={step.tone}
                left={left}
                fullBleedLeft={fullBleedLeft}
              >
                <p className="text-sm font-semibold text-[var(--accent)]">
                  Passo {step.n}
                </p>
                <TextRevealOnScroll
                  as="h3"
                  text={step.title}
                  className="mt-4 text-4xl font-bold tracking-tight md:text-6xl"
                  mutedColor={muted}
                  activeColor={active}
                />
                <TextRevealOnScroll
                  text={step.body}
                  className="mt-5 max-w-xl text-lg leading-relaxed md:text-2xl"
                  mutedColor={muted}
                  activeColor={isDark ? "#e5e7eb" : "#5c5c66"}
                />
              </PanelShell>
            </div>
          </div>
        );
      })}
    </section>
  );
}
