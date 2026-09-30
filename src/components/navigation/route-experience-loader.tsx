"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ExperiencePreloaderOverlay } from "@/components/ui/experience-preloader";

const MAX_READY_MS = 3_200;
const MIN_VISIBLE_MS = 650;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function waitForFonts(timeoutMs: number) {
  if (typeof document === "undefined" || !document.fonts?.ready) return;
  await Promise.race([document.fonts.ready, delay(timeoutMs)]);
}

async function waitForImages(root: HTMLElement, timeoutMs: number) {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (imgs.length === 0) return;

  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      ),
    ),
    delay(timeoutMs),
  ]);
}

async function waitUntilPageReady(root: HTMLElement | null) {
  const started = performance.now();
  await nextFrame();
  await nextFrame();

  const elapsed = () => performance.now() - started;
  const remaining = () => Math.max(0, MAX_READY_MS - elapsed());

  await waitForFonts(Math.min(900, remaining()));
  if (root) {
    await waitForImages(root, Math.min(900, remaining()));
  }

  const minLeft = MIN_VISIBLE_MS - elapsed();
  if (minLeft > 0) await delay(minLeft);
}

function isInternalAppLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || anchor.target === "_blank") return false;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const url = new URL(href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return href.startsWith("/");
}

export function RouteExperienceLoader({
  variant,
  children,
}: {
  variant: "cliente" | "admin";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState(true);
  const runId = useRef(0);

  const beginLoad = useCallback(() => {
    setOverlay(true);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalAppLink(anchor)) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href === pathname || href.split("?")[0] === pathname) return;
      beginLoad();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [beginLoad, pathname]);

  useEffect(() => {
    const id = ++runId.current;
    beginLoad();

    let cancelled = false;

    void (async () => {
      await waitUntilPageReady(contentRef.current);
      if (cancelled || runId.current !== id) return;
      setOverlay(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, beginLoad]);

  return (
    <>
      <ExperiencePreloaderOverlay variant={variant} active={overlay} />
      <div ref={contentRef} className="min-w-0 flex-1">
        {children}
      </div>
    </>
  );
}
