"use client";

export type AnalyticsEventType =
  | "page_view"
  | "product_click"
  | "contribution_start"
  | "signup";

export async function trackEvent(
  event_type: AnalyticsEventType,
  opts?: {
    path?: string;
    product_id?: string;
    meta?: Record<string, unknown>;
  },
) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type,
        path: opts?.path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
        product_id: opts?.product_id,
        meta: opts?.meta ?? {},
      }),
      keepalive: true,
    });
  } catch {
    // tracking must never break UX
  }
}
