"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Fingerprint, QrCode, PackageCheck, type LucideIcon } from "lucide-react";
import { DeviceMockupStage } from "@/components/landing/device-mockup-stage";
import {
  FramerDeviceMockup,
  type DeviceMockupAngle,
  type DeviceMockupColor,
} from "@/components/landing/framer-device-mockup";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const STEPS: {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  angle: DeviceMockupAngle;
  color: DeviceMockupColor;
  wallpaper: string;
}[] = [
  {
    id: "escolha",
    title: "Escolha",
    body: "Toque no produto e veja detalhes e defina uma meta.",
    icon: Fingerprint,
    angle: "left",
    color: "silver",
    wallpaper:
      "radial-gradient(ellipse at 30% 20%, #1a3a5c 0%, #0a0a0c 55%, #050508 100%)",
  },
  {
    id: "aporte",
    title: "Aporte via Pix",
    body: "Entre, reserve e pague aos poucos sem juros.",
    icon: QrCode,
    angle: "straight",
    color: "silver",
    wallpaper:
      "radial-gradient(ellipse at 70% 15%, #0d2f1f 0%, #0a0a0c 50%, #050508 100%)",
  },
  {
    id: "retire",
    title: "Retire",
    body: "Com a reserva quitada, retire na loja iPlanet.",
    icon: PackageCheck,
    angle: "right",
    color: "silver",
    wallpaper:
      "radial-gradient(ellipse at 40% 25%, #2a1a4a 0%, #0a0a0c 55%, #050508 100%)",
  },
];

/** Mini app UI designed in 402×874 space — fills the bezel screen slot. */
function StepScreenContent({
  title,
  body,
  icon: Icon,
  wallpaper,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
  wallpaper: string;
}) {
  return (
    <div
      style={{
        width: 402,
        height: 874,
        background: wallpaper,
        display: "flex",
        flexDirection: "column",
        padding: "72px 36px 48px",
        boxSizing: "border-box",
        color: "#f5f5f7",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 48,
          opacity: 0.55,
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        <span>iPlanet Pay</span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#0071E3",
            boxShadow: "0 0 12px rgba(0,113,227,0.7)",
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 48px rgba(0,0,0,0.35)",
          }}
        >
          <Icon size={40} strokeWidth={1.4} color="#0071E3" aria-hidden />
        </div>

        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 20,
              lineHeight: 1.45,
              color: "rgba(245,245,247,0.72)",
              maxWidth: 300,
            }}
          >
            {body}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "18px 22px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: 14,
          color: "rgba(245,245,247,0.55)",
          letterSpacing: "0.01em",
        }}
      >
        Sem juros · Ritmo seu
      </div>
    </div>
  );
}

export function ComoFuncionaReveal() {
  return (
    <section id="como-funciona" className="relative bg-white">
      {/* ——— Tela 1: lineup grande ——— */}
      <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-white via-[#f5f5f7] to-[#ececf0]">
        <div className="relative z-10 mx-auto grid max-w-6xl gap-6 px-4 pb-4 pt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:items-end md:gap-10 md:px-8 md:pb-8 md:pt-20 lg:pt-24">
          <motion.div {...fadeUp} className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Como funciona
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-[#111] md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Três passos. Ritmo seu.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[#5c5c66] md:text-lg">
              Escolha o produto, aporte via Pix no seu tempo e retire na loja
              iPlanet quando a reserva estiver quitada.
            </p>
          </motion.div>
        </div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
          className="relative mx-auto h-[min(62dvh,560px)] w-full max-w-6xl md:h-[min(68dvh,640px)]"
        >
          <DeviceMockupStage fullBleed />
        </motion.div>
      </div>

      {/* ——— Tela 2: 3 iPhones com os passos ——— */}
      <div className="relative bg-white px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-10 max-w-2xl md:mb-14">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              No app
            </p>
            <h3 className="text-3xl font-bold tracking-tight text-[#111] md:text-4xl">
              Do toque à retirada.
            </h3>
            <p className="mt-3 text-base text-[#5c5c66] md:text-lg">
              Três telas. Sem rótulos de passo — só o fluxo.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 items-start gap-10 sm:grid-cols-3 sm:gap-5 md:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.06 * i }}
                className="mx-auto w-full max-w-[280px] sm:max-w-none"
              >
                <FramerDeviceMockup angle={step.angle} color={step.color}>
                  <StepScreenContent
                    title={step.title}
                    body={step.body}
                    icon={step.icon}
                    wallpaper={step.wallpaper}
                  />
                </FramerDeviceMockup>
                {/* Caption under device for a11y / mobile clarity */}
                <div className="mt-5 text-center sm:px-1">
                  <p className="text-lg font-semibold tracking-tight text-[#111]">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-[#5c5c66]">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ——— Tela 3: unboxing grande ——— */}
      <div className="relative min-h-[100dvh] overflow-hidden bg-black">
        <Image
          src="/images/iphone-18-pro-max-unboxing.png"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[100dvh] items-end">
          <motion.div
            {...fadeUp}
            className="mx-auto w-full max-w-6xl px-4 pb-[max(3rem,env(safe-area-inset-bottom,0px))] pt-24 md:px-8 md:pb-20"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Resultado
            </p>
            <h3 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Seu iPhone, no seu ritmo
            </h3>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
              Da escolha à retirada: iPlanet Pay une as lojas físicas ao Pix no
              seu tempo.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
