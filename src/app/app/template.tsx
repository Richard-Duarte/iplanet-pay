"use client";

import { RouteExperienceLoader } from "@/components/navigation/route-experience-loader";
import { RouteTransition } from "@/components/ui/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <RouteExperienceLoader variant="cliente">
      <RouteTransition>{children}</RouteTransition>
    </RouteExperienceLoader>
  );
}
