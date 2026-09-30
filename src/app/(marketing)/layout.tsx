import type { ReactNode } from "react";
import { HomeBootGate } from "@/components/landing/home-boot-gate";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <HomeBootGate>{children}</HomeBootGate>;
}
