"use client";

import { useMemo, useRef } from "react";
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
  const opacity = useTransform(progress, range, [0.22, 1]);
  const color = useTransform(progress, range, [mutedColor, activeColor]);

  return (
    <motion.span
      style={{ opacity, color }}
      className="mr-[0.28em] inline-block will-change-[opacity,color]"
    >
      {children}
    </motion.span>
  );
}

export function TextRevealOnScroll({
  text,
  className,
  mutedColor = "#9ca3af",
  activeColor = "#111111",
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  mutedColor?: string;
  activeColor?: string;
  as?: "p" | "h2" | "h3" | "span";
}) {
  const ref = useRef<HTMLElement>(null);
  const words = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean),
    [text],
  );

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.35"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 28,
    mass: 0.35,
  });

  return (
    <Tag
      ref={ref as never}
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
