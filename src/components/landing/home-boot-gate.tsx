"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ExperiencePreloader } from "@/components/ui/experience-preloader";
import { waitUntilPageReady } from "@/lib/navigation/wait-until-page-ready";

/**
 * SSR com overlay visível (useState true) — skeleton no HTML antes do JS.
 * Esconde só quando conteúdo + imagens principais estão prontos.
 */
export function HomeBootGate({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showBoot, setShowBoot] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await waitUntilPageReady(contentRef.current, {
        imageCap: 4,
        minVisibleMs: 900,
      });
      if (!cancelled) setShowBoot(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {showBoot ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-[var(--bg)]"
          aria-busy="true"
          aria-live="polite"
        >
          <ExperiencePreloader variant="landing" className="min-h-screen" />
        </div>
      ) : null}
      <div ref={contentRef}>{children}</div>
    </>
  );
}
