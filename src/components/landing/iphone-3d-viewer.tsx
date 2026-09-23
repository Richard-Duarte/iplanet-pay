"use client";

import dynamic from "next/dynamic";
import { MotionFade } from "@/components/ui/motion";

const Iphone3dCanvas = dynamic(
  () => import("@/components/landing/iphone-3d-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-[28px] border border-white/10 bg-black md:h-[560px]">
        <div className="h-40 w-24 animate-pulse rounded-[28px] bg-white/10" />
      </div>
    ),
  },
);

export function Experiencia3dSection() {
  return (
    <section id="experiencia-3d" className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <MotionFade>
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            GIRE O IPHONE 18 PRO MAX
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-white/55 md:text-base">
            Visualize o modelo em 3D. Arraste para orbitar, use pinça ou scroll
            para zoom — a mesma experiência premium das lojas iPlanet.
          </p>
        </MotionFade>
        <div className="mt-10">
          <Iphone3dCanvas />
        </div>
      </div>
    </section>
  );
}
