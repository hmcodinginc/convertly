import * as React from "react"
import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number
}

function FadeIn({
  className,
  children,
  delay = 0,
  ...props
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={cn(className)}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ once: true, amount: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export { FadeIn }
