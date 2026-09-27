"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Site-wide smooth / slower wheel scroll (Lenis).
 * Mount once in the root layout client wrapper.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const lenis = new Lenis({
      // Higher duration = slower, more gliding scroll
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.1,
      prevent: (node) =>
        document.body.classList.contains("iphone-3d-modal-open") ||
        Boolean(node.closest?.("[data-lenis-prevent-touch]")),
    });

    let raf = 0;
    const frame = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onChange = () => {
      if (reduce.matches) lenis.stop();
      else lenis.start();
    };
    reduce.addEventListener("change", onChange);

    return () => {
      reduce.removeEventListener("change", onChange);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
