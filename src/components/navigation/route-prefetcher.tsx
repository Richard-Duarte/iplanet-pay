"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Light prefetch — avoids hammering mobile CPUs/network (which felt like “travando”).
 */
export function RoutePrefetcher({
  routes,
}: {
  routes: readonly string[];
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const isMobile =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 768px)").matches;

    const saveData =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData;

    if (saveData) return;

    const maxRoutes = isMobile ? 3 : 5;
    const staggerMs = isMobile ? 350 : 120;
    const slice = routes.slice(0, maxRoutes);

    const prefetchOne = (href: string) => {
      if (cancelled) return;
      try {
        router.prefetch(href);
      } catch {
        /* ignore */
      }
    };

    const prefetchAll = () => {
      if (cancelled) return;
      slice.forEach((href, index) => {
        window.setTimeout(() => prefetchOne(href), index * staggerMs);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(prefetchAll, { timeout: 6000 });
    } else {
      timeoutId = setTimeout(prefetchAll, 800);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [router, routes]);

  return null;
}
