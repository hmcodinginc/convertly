import { motion, useReducedMotion } from "framer-motion"

import { VERTLY_BACKDROP_TRANSITION } from "@/features/vertly/motion/vertlyMotion"

type VertlyBackdropProps = {
  onClose: () => void
}

function VertlyBackdrop({ onClose }: VertlyBackdropProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.button
      type="button"
      className="vertly-backdrop"
      aria-label="Close Vertly assistant"
      onClick={onClose}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
      animate={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 1, backdropFilter: "blur(10px)" }
      }
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
      transition={VERTLY_BACKDROP_TRANSITION}
    />
  )
}

export { VertlyBackdrop }
