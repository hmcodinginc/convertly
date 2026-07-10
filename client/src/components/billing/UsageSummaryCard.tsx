import type { ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { AnimatedStatusBadge } from "@/components/dashboard/AnimatedStatusBadge"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Text } from "@/components/ui/typography/Text"
import type { BillingUsage } from "@/types/billing"
import { cn } from "@/lib/utils"

type UsageSummaryProps = {
  auditsUsed: number
  auditsIncluded: number
  auditsRemaining: number
  period: "lifetime" | "month"
  periodEnd?: string | null
}

type UsageSummaryCardProps = {
  usage: BillingUsage | UsageSummaryProps
  planName?: string
  previousPlanName?: string | null
  showHeading?: boolean
  footer?: ReactNode
  stretch?: boolean
  celebrateUpgrade?: boolean
}

function AnimatedValue({
  value,
  celebrate,
}: {
  value: number
  celebrate?: boolean
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={value}
        className="usage-stats-group__value"
        initial={celebrate && !shouldReduceMotion ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {value}
      </motion.p>
    </AnimatePresence>
  )
}

function UsageSummaryCard({
  usage,
  planName,
  previousPlanName,
  showHeading = true,
  footer,
  stretch = false,
  celebrateUpgrade = false,
}: UsageSummaryCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const percent =
    usage.auditsIncluded > 0
      ? Math.min(100, Math.round((usage.auditsUsed / usage.auditsIncluded) * 100))
      : 0

  const periodLabel =
    usage.period === "lifetime"
      ? "Lifetime allowance"
      : usage.periodEnd
        ? `Resets ${new Date(usage.periodEnd).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`
        : "Monthly allowance"

  return (
    <div className={cn("usage-panel", stretch && "usage-panel--stretch")}>
      {showHeading ? (
        <div className="usage-panel__header">
          <div className="usage-panel__heading">
            <Text
              variant="muted"
              size="sm"
              className="max-w-none text-xs font-medium uppercase tracking-wide"
            >
              Audit usage
            </Text>
            {planName ? (
              <div className="usage-panel__plan-row">
                <AnimatePresence mode="wait">
                  {celebrateUpgrade && previousPlanName ? (
                    <motion.div
                      key="transition"
                      className="usage-panel__plan-transition"
                      initial={shouldReduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Text
                        size="sm"
                        className="usage-panel__plan-previous max-w-none font-medium"
                      >
                        {previousPlanName}
                      </Text>
                      <span className="usage-panel__plan-arrow" aria-hidden>
                        ↓
                      </span>
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Text size="sm" className="max-w-none font-medium text-foreground">
                          {planName} plan
                        </Text>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={planName}
                      initial={celebrateUpgrade && !shouldReduceMotion ? { opacity: 0, y: 4 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Text size="sm" className="max-w-none font-medium text-foreground">
                        {planName} plan
                      </Text>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}
          </div>
          {celebrateUpgrade ? (
            <AnimatedStatusBadge label="Premium active" variant="success" animateOnce />
          ) : (
            <StatusBadge
              label={usage.period === "lifetime" ? "Lifetime" : "Monthly"}
              variant="accent"
            />
          )}
        </div>
      ) : null}

      <div className="usage-stats-group">
        <div className="usage-stats-group__stat">
          <Text variant="muted" size="sm" className="max-w-none text-xs">
            Used
          </Text>
          <AnimatedValue value={usage.auditsUsed} celebrate={celebrateUpgrade} />
        </div>
        <div className="usage-stats-group__stat">
          <Text variant="muted" size="sm" className="max-w-none text-xs">
            Remaining
          </Text>
          <AnimatedValue value={usage.auditsRemaining} celebrate={celebrateUpgrade} />
        </div>
      </div>

      <div
        className="usage-panel__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Audit usage"
      >
        <motion.div
          className="usage-panel__track-fill"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={
            celebrateUpgrade && !shouldReduceMotion
              ? { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0 }
          }
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={`${usage.auditsUsed}-${usage.auditsIncluded}`}
          className="usage-panel__summary"
          initial={celebrateUpgrade && !shouldReduceMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          {usage.auditsUsed} of {usage.auditsIncluded} audits used ({percent}%)
        </motion.p>
      </AnimatePresence>
      <p className="usage-panel__period">{periodLabel}</p>

      {footer ? <div className="usage-panel__footer">{footer}</div> : null}
    </div>
  )
}

export { UsageSummaryCard }
