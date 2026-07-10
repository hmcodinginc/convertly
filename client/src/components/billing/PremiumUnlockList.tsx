import { motion, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"

import { Text } from "@/components/ui/typography/Text"
import type { PremiumUnlockItem } from "@/lib/premiumActivationContent"
import { cn } from "@/lib/utils"

import "./PremiumUnlockList.css"

type PremiumUnlockListProps = {
  items: PremiumUnlockItem[]
  className?: string
  animate?: boolean
}

function PremiumUnlockList({ items, className, animate = false }: PremiumUnlockListProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <ul className={cn("premium-unlock-list", className)}>
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          className="premium-unlock-list__item"
          initial={animate && !shouldReduceMotion ? { opacity: 0, y: 8 } : false}
          animate={animate && !shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: 0.35,
            delay: animate && !shouldReduceMotion ? index * 0.08 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="premium-unlock-list__icon" aria-hidden>
            <Check className="size-3.5" />
          </span>
          <Text size="sm" className="premium-unlock-list__label">
            {item.label}
          </Text>
        </motion.li>
      ))}
    </ul>
  )
}

export { PremiumUnlockList }
