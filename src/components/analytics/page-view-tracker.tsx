"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

export function PageViewTracker({ path }: { path: string }) {
  useEffect(() => {
    void trackEvent("page_view", { path });
  }, [path]);
  return null;
}
