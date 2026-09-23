"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { QrCode, PackageCheck } from "lucide-react";
import { TextRevealOnScroll } from "@/components/landing/text-reveal-on-scroll";
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
    tone: "soft" as const,
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
      className={`flex h-36 w-36 items-center justify-center rounded-[36px] md:h-52 md:w-52 ${
        dark
          ? "border border-white/15 bg-white/10 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-md"
          : "border border-white/80 bg-white text-[var(--accent)] shadow-[0_24px_60px_rgba(17,17,17,0.08)]"
      }`}
    >
      <Icon
        className="h-16 w-16 md:h-24 md:w-24"
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
      : tone === "soft"
        ? "bg-gradient-to-b from-white to-[#eef3fb]"
        : tone === "white"
          ? "bg-white"
          : "bg-black";

  const showUnboxing = tone === "unboxing";

  if (fullBleedDevices) {
    return (
      <div className={`relative h-[100dvh] w-full overflow-hidden ${bg}`}>
        <DeviceMockupStage fullBleed />
        <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-14 pt-20 md:px-10 md:pb-20 lg:max-w-xl lg:justify-end lg:pb-24">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-[100dvh] w-full ${
        overlayCopy ? "items-end" : "items-center"
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
        className={`relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:gap-12 md:px-8 ${
          overlayCopy ? "items-end pb-16 md:pb-24" : "items-center"
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
    <div ref={scrollRef} className="relative h-[130vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <PanelShell
          tone={step.tone}
          left={left}
          fullBleedDevices={fullBleedDevices}
          overlayCopy={overlayCopy}
        >
          <TextRevealOnScroll
            as="h3"
            text={step.title}
            className="text-4xl font-bold tracking-tight md:text-6xl"
            mutedColor={muted}
            activeColor={active}
            scrollTargetRef={scrollRef}
          />
          <TextRevealOnScroll
            text={step.body}
            className="mt-5 max-w-xl text-lg leading-relaxed md:text-2xl"
            mutedColor={muted}
            activeColor={bodyActive}
            scrollTargetRef={scrollRef}
          />
        </PanelShell>
      </div>
    </div>
  );
}
