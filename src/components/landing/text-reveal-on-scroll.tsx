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
const REVEAL_COMPLETE_AT = 0.5;

const SOFT_SPRING = {
  stiffness: 48,
  damping: 28,
  mass: 0.55,
  restDelta: 0.001,
} as const;

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
  const color = useTransform(progress, range, [mutedColor, activeColor]);

  return (
    <motion.span style={{ color }} className="mr-[0.28em] inline-block">
      {children}
    </motion.span>
  );
}

function RevealWords({
  text,
  className,
  mutedColor,
  activeColor,
  as: Tag,
  progress,
}: {
  text: string;
  className?: string;
  mutedColor: string;
  activeColor: string;
  as: "p" | "h2" | "h3" | "span";
  progress: MotionValue<number>;
}) {
  const words = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean),
    [text],
  );

  return (
    <Tag className={cn("flex flex-wrap", className)} aria-label={text}>
      {words.map((word, i) => {
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

/** Shared sticky-panel scroll progress — call once per step. */
export function useStickyRevealProgress(
  scrollTargetRef: RefObject<HTMLElement | null>,
) {
  const { scrollYProgress } = useScroll({
    target: scrollTargetRef,
    offset: ["start start", "end end"],
  });

  return useSpring(scrollYProgress, SOFT_SPRING);
}

export function TextRevealOnScroll({
  text,
  className,
  mutedColor = "#a1a1a6",
  activeColor = "#111111",
  as: Tag = "p",
  scrollTargetRef,
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
  if (externalProgress) {
    return (
      <RevealWords
        text={text}
        className={className}
        mutedColor={mutedColor}
        activeColor={activeColor}
        as={Tag}
        progress={externalProgress}
      />
    );
  }

  return (
    <TextRevealWithLocalScroll
      text={text}
      className={className}
      mutedColor={mutedColor}
      activeColor={activeColor}
      as={Tag}
      scrollTargetRef={scrollTargetRef}
    />
  );
}

function TextRevealWithLocalScroll({
  text,
  className,
  mutedColor,
  activeColor,
  as: Tag,
  scrollTargetRef,
}: {
  text: string;
  className?: string;
  mutedColor: string;
  activeColor: string;
  as: "p" | "h2" | "h3" | "span";
  scrollTargetRef?: RefObject<HTMLElement | null>;
}) {
  const localRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollTargetRef ?? localRef,
    offset: scrollTargetRef
      ? ["start start", "end end"]
      : ["start 0.85", "end 0.35"],
  });
  const progress = useSpring(scrollYProgress, SOFT_SPRING);

  const words = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean),
    [text],
  );

  return (
    <Tag
      ref={localRef as never}
      className={cn("flex flex-wrap", className)}
      aria-label={text}
    >
      {words.map((word, i) => {
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
