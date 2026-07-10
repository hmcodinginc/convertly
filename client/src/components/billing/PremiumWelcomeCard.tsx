import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Sparkles, X } from "lucide-react"
import { Link } from "react-router-dom"

import { PremiumUnlockList } from "@/components/billing/PremiumUnlockList"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import {
  getPremiumUnlockBenefits,
  getPremiumWelcomeDescription,
  getPremiumWelcomeHeadline,
} from "@/lib/premiumActivationContent"
import type { SubscriptionPlanId } from "@/lib/billingPlans"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

import "./PremiumWelcomeCard.css"

type PremiumWelcomeCardProps = {
  planId: SubscriptionPlanId
  planName: string
  onDismiss: () => void
  className?: string
  showCelebration?: boolean
}

function PremiumWelcomeCard({
  planId,
  planName,
  onDismiss,
  className,
  showCelebration = true,
}: PremiumWelcomeCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const benefits = getPremiumUnlockBenefits(planId)

  return (
    <motion.div
      className={cn("premium-welcome", className)}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="premium-welcome__card app-card-body hover:translate-y-0">
        {showCelebration ? (
          <div className="premium-welcome__glow" aria-hidden />
        ) : null}

        <button
          type="button"
          className="premium-welcome__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss welcome message"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="premium-welcome__header">
          <div className="premium-welcome__icon-wrap">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="premium-welcome__copy">
            <Text size="sm" className="premium-welcome__eyebrow">
              Premium unlocked
            </Text>
            <Heading level={2} size="subsection" className="premium-welcome__title">
              {getPremiumWelcomeHeadline(planName)}
            </Heading>
            <Text variant="muted" size="sm" className="premium-welcome__description">
              {getPremiumWelcomeDescription(planName)}
            </Text>
          </div>
        </div>

        <PremiumUnlockList items={benefits} animate className="premium-welcome__benefits" />

        <div className="premium-welcome__status">
          <span className="premium-welcome__status-dot" aria-hidden />
          <Text size="sm" className="premium-welcome__status-label">
            Current plan · {planName} · Premium active · Everything ready
          </Text>
        </div>

        <div className="premium-welcome__actions app-button-row">
          <Button asChild>
            <Link to={ROUTES.auditNew}>
              Run your first Premium Audit
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.billing}>View Billing</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.dashboard}>Dashboard</Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export { PremiumWelcomeCard }
