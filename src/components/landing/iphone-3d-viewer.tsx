"use client";

import dynamic from "next/dynamic";
import { MotionFade } from "@/components/ui/motion";

const Iphone3dCanvas = dynamic(
  () => import("@/components/landing/iphone-3d-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[70vh] w-full items-center justify-center rounded-[28px] border border-black/8 bg-white md:min-h-[720px]">
        <div className="h-56 w-28 animate-pulse rounded-[28px] bg-black/5" />
      </div>
    ),
  },
);

export function Experiencia3dSection() {
  return (
    <section id="experiencia-3d" className="bg-white text-[#111]">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <MotionFade>
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#111] md:text-5xl lg:text-6xl">
            IPHONE 18 PRO MAX
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base font-medium leading-relaxed text-[#1d1d1f] md:text-xl">
            transforme seu sonho em meta.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#6e6e73] md:hidden">
            Toque em{" "}
            <span className="font-semibold text-[#111]">Clique para explorar</span>{" "}
            para abrir em tela cheia e girar com o dedo.
          </p>
          <p className="mx-auto mt-3 hidden max-w-2xl text-center text-base leading-relaxed text-[#6e6e73] md:block">
            Clique em{" "}
            <span className="font-semibold text-[#111]">Clique para explorar</span>{" "}
            e arraste para girar — a rolagem da página continua normal.
          </p>
        </MotionFade>
        <div className="mt-10">
          <Iphone3dCanvas />
        </div>
      </div>
    </section>
  );
}
