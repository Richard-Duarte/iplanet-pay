"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/ui/motion";

/**
 * Admin-specific snappy page transition.
 * Quick fade+slide without mode="wait" so navigation feels instant.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence initial={false}>
      <PageTransition key={pathname}>{children}</PageTransition>
    </AnimatePresence>
  );
}
