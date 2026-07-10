import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/dashboard/StatusBadge"
import { cn } from "@/lib/utils"

type AnimatedStatusBadgeProps = {
  label: string
  variant?: StatusBadgeVariant
  className?: string
  animateOnce?: boolean
}

function AnimatedStatusBadge({
  label,
  variant = "default",
  className,
  animateOnce = false,
}: AnimatedStatusBadgeProps) {
  const shouldReduceMotion = useReducedMotion()
  const [hasAnimated, setHasAnimated] = useState(!animateOnce)

  useEffect(() => {
    if (!animateOnce || shouldReduceMotion) {
      setHasAnimated(true)
      return
    }

    const timerId = window.setTimeout(() => setHasAnimated(true), 900)
    return () => window.clearTimeout(timerId)
  }, [animateOnce, shouldReduceMotion])

  const shouldPlay = animateOnce && !hasAnimated && !shouldReduceMotion

  return (
    <motion.span
      className={cn("inline-flex", className)}
      initial={shouldPlay ? { scale: 0.92, opacity: 0.6 } : false}
      animate={shouldPlay ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <StatusBadge label={label} variant={variant} />
    </motion.span>
  )
}

export { AnimatedStatusBadge }
