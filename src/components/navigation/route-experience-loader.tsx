"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  ExperiencePreloaderOverlay,
  type ExperiencePreloaderVariant,
} from "@/components/ui/experience-preloader";
import { waitUntilPageReady } from "@/lib/navigation/wait-until-page-ready";

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
  variant: ExperiencePreloaderVariant;
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
      await waitUntilPageReady(contentRef.current, {
        imageCap: variant === "landing" ? 4 : 12,
      });
      if (cancelled || runId.current !== id) return;
      setOverlay(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, beginLoad, variant]);

  return (
    <>
      <ExperiencePreloaderOverlay variant={variant} active={overlay} />
      <div ref={contentRef} className="min-w-0 flex-1">
        {children}
      </div>
    </>
  );
}
