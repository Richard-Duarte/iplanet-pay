"use client";

import { motion } from "framer-motion";
import { Fingerprint, QrCode, PackageCheck, type LucideIcon } from "lucide-react";
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

/** Como funciona — three device mockups only (Do toque à retirada). */
export function ComoFuncionaReveal() {
  return (
    <section id="como-funciona" className="relative bg-white">
      <div className="relative bg-white px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-10 max-w-2xl md:mb-14">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              No app
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[#111] md:text-4xl">
              Do toque à retirada.
            </h2>
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
    </section>
  );
}
