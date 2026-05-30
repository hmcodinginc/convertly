import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"

import {
  CONVERTLY_MARK_BRACKETS,
  CONVERTLY_MARK_DOT,
  CONVERTLY_MARK_RING,
  CONVERTLY_MARK_VIEWBOX,
} from "@/components/brand/convertlyMarkPaths"
import { cn } from "@/lib/utils"

type ConvertlyMarkAnimatedProps = React.SVGAttributes<SVGSVGElement> & {
  size?: number
  /** Draw-in sequence for loading states */
  variant?: "idle" | "loading" | "static"
}

const bracketVariants = {
  hidden: { pathLength: 0, opacity: 0.35 },
  visible: (index: number) => ({
    pathLength: 1,
    opacity: 0.9,
    transition: {
      pathLength: { delay: index * 0.14, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      opacity: { delay: index * 0.14, duration: 0.35, ease: "easeOut" },
    },
  }),
}

const ringVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: CONVERTLY_MARK_RING.opacity,
    scale: 1,
    transition: { delay: 0.42, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  idle: {
    opacity: [
      CONVERTLY_MARK_RING.opacity * 0.85,
      CONVERTLY_MARK_RING.opacity,
      CONVERTLY_MARK_RING.opacity * 0.85,
    ],
    scale: [1, 1.05, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
}

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { delay: 0.55, type: "spring", stiffness: 380, damping: 22 },
  },
  idle: {
    scale: [1, 1.1, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.25 },
  },
}

function ConvertlyMarkAnimated({
  size = 24,
  variant = "idle",
  className,
  ...props
}: ConvertlyMarkAnimatedProps) {
  const shouldReduceMotion = useReducedMotion()
  const isStatic = variant === "static" || shouldReduceMotion
  const isLoading = variant === "loading" && !shouldReduceMotion

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={CONVERTLY_MARK_VIEWBOX}
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={cn("shrink-0 text-foreground", className)}
      initial={isStatic ? false : "hidden"}
      animate={isStatic ? undefined : isLoading ? "visible" : "idle"}
      {...props}
    >
      {CONVERTLY_MARK_BRACKETS.map((bracket, index) => (
        <motion.path
          key={bracket.id}
          d={bracket.d}
          stroke="currentColor"
          strokeWidth={bracket.strokeWidth}
          strokeLinecap="round"
          fill="none"
          custom={index}
          variants={
            isStatic
              ? undefined
              : isLoading
                ? bracketVariants
                : {
                    idle: {
                      opacity: [0.55, 0.88, 0.55],
                      transition: {
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.12,
                      },
                    },
                  }
          }
          initial={isStatic ? undefined : isLoading ? "hidden" : false}
          animate={isStatic ? undefined : isLoading ? "visible" : "idle"}
        />
      ))}
      <motion.circle
        cx={CONVERTLY_MARK_RING.cx}
        cy={CONVERTLY_MARK_RING.cy}
        r={CONVERTLY_MARK_RING.r}
        stroke="currentColor"
        strokeWidth={CONVERTLY_MARK_RING.strokeWidth}
        fill="none"
        variants={isStatic ? undefined : ringVariants}
        initial={isStatic ? undefined : isLoading ? "hidden" : false}
        animate={isStatic ? undefined : isLoading ? "visible" : "idle"}
      />
      <motion.circle
        cx={CONVERTLY_MARK_DOT.cx}
        cy={CONVERTLY_MARK_DOT.cy}
        r={CONVERTLY_MARK_DOT.r}
        fill="currentColor"
        variants={isStatic ? undefined : dotVariants}
        initial={isStatic ? undefined : isLoading ? "hidden" : false}
        animate={isStatic ? undefined : isLoading ? "visible" : "idle"}
      />
    </motion.svg>
  )
}

export { ConvertlyMarkAnimated }
