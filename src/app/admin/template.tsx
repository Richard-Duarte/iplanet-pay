"use client";

import { RouteTransition } from "@/components/ui/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return <RouteTransition>{children}</RouteTransition>;
}
