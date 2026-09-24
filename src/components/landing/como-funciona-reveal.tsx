"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { QrCode, PackageCheck } from "lucide-react";
import {
  TextRevealOnScroll,
  useStickyRevealProgress,
} from "@/components/landing/text-reveal-on-scroll";
import { DeviceMockupStage } from "@/components/landing/device-mockup-stage";

const STEPS = [
  {
    id: "escolha",
    title: "Escolha",
    body: "Toque no produto e veja detalhes e defina uma meta.",
    tone: "light" as const,
  },
  {
    id: "aporte",
    title: "Aporte via Pix",
    body: "Entre, reserve e pague aos poucos sem juros.",
    tone: "white" as const,
    icon: "pix" as const,
  },
  {
    id: "retire",
    title: "Retire",
    body: "Com a reserva quitada, retire na loja iPlanet.",
    tone: "white" as const,
    icon: "retire" as const,
  },
  {
    id: "ritmo",
    title: "Seu iPhone, no seu ritmo",
    body: "Da escolha à retirada: iPlanet Pay une as lojas físicas ao Pix no seu tempo.",
    tone: "unboxing" as const,
  },
] as const;

function StepIconCard({
  icon,
  dark,
}: {
  icon: "pix" | "retire";
  dark?: boolean;
}) {
  const Icon = icon === "pix" ? QrCode : PackageCheck;
  return (
    <div
      className={`flex h-28 w-28 items-center justify-center rounded-[28px] md:h-40 md:w-40 md:rounded-[36px] [@media(max-height:740px)]:h-24 [@media(max-height:740px)]:w-24 [@media(max-height:740px)]:rounded-[22px] [@media(min-height:900px)]:md:h-52 [@media(min-height:900px)]:md:w-52 ${
        dark
          ? "border border-white/15 bg-white/10 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-md"
          : "border border-white/80 bg-white text-[var(--accent)] shadow-[0_24px_60px_rgba(17,17,17,0.08)]"
      }`}
    >
      <Icon
        className="h-12 w-12 md:h-20 md:w-20 [@media(max-height:740px)]:h-10 [@media(max-height:740px)]:w-10 [@media(min-height:900px)]:md:h-24 [@media(min-height:900px)]:md:w-24"
        strokeWidth={1.35}
        aria-hidden
      />
    </div>
  );
}

function PanelShell({
  tone,
  children,
  left,
  fullBleedDevices,
  overlayCopy,
}: {
  tone: (typeof STEPS)[number]["tone"];
  children: ReactNode;
  left?: ReactNode;
  fullBleedDevices?: boolean;
  /** Bottom-left / lower-third copy for overlay screens */
  overlayCopy?: boolean;
}) {
  const bg =
    tone === "light"
      ? "bg-gradient-to-b from-white via-[#f5f5f7] to-[#e8e8ec]"
      : tone === "white"
        ? "bg-white"
        : "bg-black";

  const showUnboxing = tone === "unboxing";

  if (fullBleedDevices) {
    return (
      <div className={`relative h-[100dvh] w-full min-h-0 overflow-hidden ${bg}`}>
        <DeviceMockupStage fullBleed />
        <div className="absolute inset-0 z-10 flex min-h-0 flex-col justify-end px-5 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-16 md:px-10 md:pb-14 lg:max-w-xl lg:pb-16 [@media(max-height:740px)]:pb-8 [@media(max-height:740px)]:pt-12">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-[100dvh] w-full min-h-0 overflow-hidden ${
        overlayCopy ? "items-end" : "items-center justify-center"
      } ${bg}`}
    >
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
        className={`relative z-10 mx-auto grid w-full max-w-6xl min-h-0 gap-6 px-4 py-[max(2rem,env(safe-area-inset-top,0px))] md:gap-10 md:px-8 [@media(max-height:740px)]:gap-4 [@media(max-height:740px)]:py-6 ${
          overlayCopy
            ? "items-end pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] md:pb-16 [@media(max-height:740px)]:pb-8"
            : "items-center"
        } ${
          showUnboxing
            ? ""
            : left
              ? "md:grid-cols-2"
              : ""
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

      {STEPS.map((step, idx) => (
        <StepPanel key={step.id} step={step} idx={idx} />
      ))}
    </section>
  );
}

function StepPanel({
  step,
  idx,
}: {
  step: (typeof STEPS)[number];
  idx: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const revealProgress = useStickyRevealProgress(scrollRef);
  const isDark = step.tone === "unboxing";
  // Light screens: muted dark gray, active near-black — never white active on light
  const muted = isDark ? "#6e6e73" : "#a1a1a6";
  const active = isDark ? "#ffffff" : "#111111";
  const bodyActive = isDark ? "#f5f5f7" : "#1d1d1f";

  let left: ReactNode = null;
  const fullBleedDevices = idx === 0;
  const overlayCopy = idx === 0 || step.tone === "unboxing";

  if (idx === 0) {
    left = null;
  } else if ("icon" in step && step.icon) {
    left = <StepIconCard icon={step.icon} dark={isDark} />;
  }

  return (
    <div ref={scrollRef} className="relative h-[220vh]">
      <div className="sticky top-0 h-[100dvh] min-h-0 overflow-hidden">
        <PanelShell
          tone={step.tone}
          left={left}
          fullBleedDevices={fullBleedDevices}
          overlayCopy={overlayCopy}
        >
          <TextRevealOnScroll
            as="h3"
            text={step.title}
            className="text-[clamp(1.75rem,2.2vw+1rem,3.5rem)] font-bold tracking-tight [@media(max-height:740px)]:text-[clamp(1.5rem,1.6vw+0.9rem,2.25rem)]"
            mutedColor={muted}
            activeColor={active}
            progress={revealProgress}
          />
          <TextRevealOnScroll
            text={step.body}
            className="mt-3 max-w-xl text-[clamp(1rem,0.6vw+0.85rem,1.375rem)] leading-relaxed md:mt-4 [@media(max-height:740px)]:mt-2 [@media(max-height:740px)]:text-base [@media(max-height:740px)]:leading-snug"
            mutedColor={muted}
            activeColor={bodyActive}
            progress={revealProgress}
          />
        </PanelShell>
      </div>
    </div>
  );
}
