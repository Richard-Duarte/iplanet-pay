"use client";

import type { ReactNode } from "react";
import { RouteExperienceLoader } from "@/components/navigation/route-experience-loader";

/** Pre-loader da landing pública (/) — carrega conteúdo por baixo do overlay. */
export function LandingExperienceShell({ children }: { children: ReactNode }) {
  return (
    <RouteExperienceLoader variant="landing">{children}</RouteExperienceLoader>
  );
}
