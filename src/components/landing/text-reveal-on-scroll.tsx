"use client";

import { useMemo, useRef, type RefObject } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

/** Full text revealed by this fraction of sticky-panel scroll progress. */
const REVEAL_COMPLETE_AT = 0.48;

function Word({
  children,
  progress,
  range,
  mutedColor,
  activeColor,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  mutedColor: string;
  activeColor: string;
}) {
  // Color-only Framer-style reveal — keep opacity high so muted never looks white/ghosted
  const color = useTransform(progress, range, [mutedColor, activeColor]);

  return (
    <motion.span
      style={{ color }}
      className="mr-[0.28em] inline-block will-change-[color]"
    >
      {children}
    </motion.span>
  );
}

export function TextRevealOnScroll({
  text,
  className,
  mutedColor = "#a1a1a6",
  activeColor = "#111111",
  as: Tag = "p",
  /** Drive reveal from an outer tall scroll wrapper (sticky panels). */
  scrollTargetRef,
  /** Or pass a shared MotionValue from the parent step. */
  progress: externalProgress,
}: {
  text: string;
  className?: string;
  mutedColor?: string;
  activeColor?: string;
  as?: "p" | "h2" | "h3" | "span";
  scrollTargetRef?: RefObject<HTMLElement | null>;
  progress?: MotionValue<number>;
}) {
  const localRef = useRef<HTMLElement>(null);
  const words = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean),
    [text],
  );

  // Map 0→1 across sticky travel (wrapper taller than viewport):
  // ["start start","end end"] ≈ the sticky pin window for h-[~130–140vh].
  const { scrollYProgress } = useScroll({
    target: scrollTargetRef ?? localRef,
    offset: scrollTargetRef
      ? ["start start", "end end"]
      : ["start 0.85", "end 0.35"],
  });

  const sprung = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    mass: 0.28,
  });

  const progress = externalProgress ?? sprung;

  return (
    <Tag
      ref={localRef as never}
      className={cn("flex flex-wrap", className)}
      aria-label={text}
    >
      {words.map((word, i) => {
        // Compress word ranges so the last word finishes by REVEAL_COMPLETE_AT
        // (mid sticky scroll ≈ full reveal).
        const start = (i / words.length) * REVEAL_COMPLETE_AT;
        const end = ((i + 1) / words.length) * REVEAL_COMPLETE_AT;
        return (
          <Word
            key={`${word}-${i}`}
            progress={progress}
            range={[start, end]}
            mutedColor={mutedColor}
            activeColor={activeColor}
          >
            {word}
          </Word>
        );
      })}
    </Tag>
  );
}
