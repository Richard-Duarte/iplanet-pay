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

  const { scrollYProgress } = useScroll({
    target: scrollTargetRef ?? localRef,
    offset: scrollTargetRef
      ? ["start start", "end start"]
      : ["start 0.85", "end 0.35"],
  });

  const sprung = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 28,
    mass: 0.35,
  });

  const progress = externalProgress ?? sprung;

  return (
    <Tag
      ref={localRef as never}
      className={cn("flex flex-wrap", className)}
      aria-label={text}
    >
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
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
