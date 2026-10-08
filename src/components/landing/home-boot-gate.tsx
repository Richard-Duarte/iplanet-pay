"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ExperiencePreloader } from "@/components/ui/experience-preloader";
import {
  LANDING_PRELOAD_URLS,
  waitUntilPageReady,
} from "@/lib/navigation/wait-until-page-ready";

/** Keep the overlay up until the hero video, Duo canvases and 3D stage exist. */
function landingStillLoading(root: HTMLElement) {
  const video = root.querySelector<HTMLVideoElement>("#hero video");
  if (!video) return true;
  if (
    !video.error &&
    (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA ||
      video.networkState === HTMLMediaElement.NETWORK_LOADING)
  ) {
    return true;
  }
  if (root.querySelectorAll("[data-duo-step] canvas").length < 3) return true;
  const stage = root.querySelector("#experiencia-3d");
  if (!stage?.querySelector("canvas")) return true;
  if (stage.textContent?.includes("Carregando modelo")) return true;
  return false;
}

/**
 * Overlay visível no HTML. Só solta em 100%, depois do download da mídia pesada.
 */
export function HomeBootGate({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showBoot, setShowBoot] = useState(true);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await waitUntilPageReady(contentRef.current, {
        minVisibleMs: 900,
        maxReadyMs: 180_000,
        preloadUrls: LANDING_PRELOAD_URLS,
        watchMedia: true,
        isPending: landingStillLoading,
        onProgress: (value) => {
          if (!cancelled) setPercent(value);
        },
      });
      if (!cancelled) {
        setPercent(100);
        setShowBoot(false);
      }
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
          <ExperiencePreloader
            variant="landing"
            className="min-h-screen"
            percent={percent}
          />
        </div>
      ) : null}
      <div
        ref={contentRef}
        inert={showBoot}
        aria-hidden={showBoot}
        className={showBoot ? "pointer-events-none select-none" : undefined}
      >
        {children}
      </div>
    </>
  );
}
