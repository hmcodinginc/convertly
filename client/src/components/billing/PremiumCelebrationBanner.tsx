import { motion, useReducedMotion } from "framer-motion"

import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

import "./PremiumCelebrationBanner.css"

type PremiumCelebrationBannerProps = {
  planName: string
  className?: string
}

function PremiumCelebrationBanner({ planName, className }: PremiumCelebrationBannerProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={cn("premium-celebration-banner", className)}
      initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      role="status"
    >
      <span className="premium-celebration-banner__spark premium-celebration-banner__spark--one" aria-hidden />
      <span className="premium-celebration-banner__spark premium-celebration-banner__spark--two" aria-hidden />
      <span className="premium-celebration-banner__spark premium-celebration-banner__spark--three" aria-hidden />
      <Text size="sm" className="premium-celebration-banner__label">
        {planName} active · Premium unlocked · Everything ready
      </Text>
    </motion.div>
  )
}

export { PremiumCelebrationBanner }
