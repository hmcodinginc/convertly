import * as React from "react"
import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

// Reusable Framer Motion Variants
export const fadeUp = (delay = 0, duration = 0.75, distance = 30) => ({
  initial: { opacity: 0, y: distance },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: [0.16, 1, 0.3, 1] }
})

export const fadeDown = (delay = 0, duration = 0.75, distance = 30) => ({
  initial: { opacity: 0, y: -distance },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: [0.16, 1, 0.3, 1] }
})

export const fadeLeft = (delay = 0, duration = 0.75, distance = 30) => ({
  initial: { opacity: 0, x: distance },
  whileInView: { opacity: 1, x: 0 },
  transition: { duration, delay, ease: [0.16, 1, 0.3, 1] }
})

export const fadeRight = (delay = 0, duration = 0.75, distance = 30) => ({
  initial: { opacity: 0, x: -distance },
  whileInView: { opacity: 1, x: 0 },
  transition: { duration, delay, ease: [0.16, 1, 0.3, 1] }
})

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  duration?: number
  distance?: number
}

function FadeIn({
  className,
  children,
  delay = 0,
  direction = "up",
  duration = 0.75,
  distance = 30,
  ...props
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion()

  const initialOffset = shouldReduceMotion
    ? {}
    : direction === "up" || direction === "down"
    ? { y: direction === "up" ? distance : -distance }
    : { x: direction === "left" ? distance : -distance }

  return (
    <motion.div
      className={cn(className)}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, ...initialOffset }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true, amount: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export { FadeIn }
