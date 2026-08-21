"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export interface ShiningTextProps {
  text: string;
  className?: string;
}

/**
 * A restrained loading cue for moments when S.A.F.E AI is checking evidence.
 * The reduced-motion branch keeps the status readable without the sweep.
 */
export function ShiningText({ text, className }: ShiningTextProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.span
      aria-live="polite"
      className={cn(
        "inline-flex bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-base font-normal text-transparent",
        className,
      )}
      initial={reducedMotion ? false : { backgroundPosition: "200% 0" }}
      animate={reducedMotion ? undefined : { backgroundPosition: "-200% 0" }}
      transition={
        reducedMotion
          ? undefined
          : {
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }
      }
    >
      {text}
    </motion.span>
  );
}
