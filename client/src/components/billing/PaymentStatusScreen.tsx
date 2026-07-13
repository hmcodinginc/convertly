import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react"
import { Link } from "react-router-dom"

import { ConvertlyMarkAnimated } from "@/components/brand/ConvertlyMarkAnimated"
import { PremiumUnlockList } from "@/components/billing/PremiumUnlockList"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import type { PaymentVerificationPhase } from "@/hooks/usePaymentVerification"
import { getPremiumUnlockBenefits } from "@/lib/premiumActivationContent"
import type { SubscriptionPlanId } from "@/lib/billingPlans"
import { EMAIL_BRANDING } from "@/lib/emailBranding"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

import "./PaymentStatusScreen.css"

type PaymentStatusScreenProps = {
  phase: PaymentVerificationPhase
  planName: string
  planId?: SubscriptionPlanId
  /** Plan upgrade may already be applied while provider status is still propagating. */
  upgradeLikelyApplied?: boolean
  onRetry?: () => void
  isRetrying?: boolean
  onDismiss?: () => void
}

type PhaseContent = {
  eyebrow?: string
  title: string
  description: string
  reassurance?: string
  showProgress?: boolean
  progressStep?: number
  tone: "loading" | "success" | "warning" | "neutral"
}

const LOADING_PHASES: PaymentVerificationPhase[] = [
  "processing",
  "verifying",
  "waiting",
]

function getPhaseContent(
  phase: PaymentVerificationPhase,
  planName: string,
  upgradeLikelyApplied = false
): PhaseContent {
  switch (phase) {
    case "processing":
      return {
        title: "Processing your payment",
        description: "We're securely confirming your checkout with our payment provider.",
        showProgress: true,
        progressStep: 0,
        tone: "loading",
      }
    case "verifying":
      return {
        title: "Confirming your subscription",
        description: "Almost there — we're activating your plan and updating your workspace.",
        showProgress: true,
        progressStep: 1,
        tone: "loading",
      }
    case "waiting":
      return {
        title: "Confirming your subscription…",
        description:
          "We're waiting for secure confirmation from our payment provider before unlocking your plan.",
        reassurance:
          "This usually takes less than a minute. Stay on this page — we'll update automatically.",
        showProgress: true,
        progressStep: 2,
        tone: "loading",
      }
    case "success":
      return {
        eyebrow: "Subscription confirmed",
        title: `Welcome to Convertly ${planName}`,
        description: `Your ${planName} plan is now active. Your premium audit allowance is unlocked and ready to use.`,
        tone: "success",
      }
    case "failure":
      return {
        title: "Payment failed",
        description:
          "We couldn't confirm this checkout with our payment provider. No plan change was applied.",
        tone: "warning",
      }
    case "timedOut":
      return upgradeLikelyApplied
        ? {
            title: "Still confirming your subscription",
            description: `Your ${planName} upgrade may already be active. We're still waiting for final confirmation from our payment provider.`,
            reassurance:
              "Return to Billing to check your plan, or retry verification here if it hasn't updated yet.",
            tone: "warning",
          }
        : {
            title: "Still confirming your subscription",
            description:
              "We haven't received final payment confirmation yet. You can retry verification or return to Billing.",
            reassurance: "If you were charged, contact support and we'll resolve it quickly.",
            tone: "warning",
          }
    case "cancelled":
      return {
        title: "Subscription was cancelled",
        description:
          "No payment was taken and your plan is unchanged. You can try checkout again whenever you're ready.",
        tone: "neutral",
      }
    case "idle":
      return {
        title: "Processing your payment",
        description: "Preparing verification…",
        showProgress: true,
        progressStep: 0,
        tone: "loading",
      }
  }
}

const PROGRESS_LABELS = [
  "Payment received",
  "Verifying subscription",
  "Activating plan",
] as const

function PhaseIcon({
  phase,
  tone,
  shouldReduceMotion,
}: {
  phase: PaymentVerificationPhase
  tone: PhaseContent["tone"]
  shouldReduceMotion: boolean | null
}) {
  const isLoading = LOADING_PHASES.includes(phase)

  if (isLoading) {
    return (
      <div className="payment-status__icon-wrap payment-status__icon-wrap--loading">
        <ConvertlyMarkAnimated size={40} variant="loading" />
      </div>
    )
  }

  if (phase === "success") {
    return (
      <motion.div
        className="payment-status__icon-wrap payment-status__icon-wrap--success"
        initial={shouldReduceMotion ? false : { scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <CheckCircle2 className="payment-status__icon payment-status__icon--success" aria-hidden />
        <Sparkles className="payment-status__sparkle payment-status__sparkle--left" aria-hidden />
        <Sparkles className="payment-status__sparkle payment-status__sparkle--right" aria-hidden />
      </motion.div>
    )
  }

  const iconClassName = cn(
    "payment-status__icon",
    tone === "warning" && "payment-status__icon--warning",
    tone === "neutral" && "payment-status__icon--muted"
  )

  const wrapClassName = cn(
    "payment-status__icon-wrap",
    tone === "warning" && "payment-status__icon-wrap--warning",
    tone === "neutral" && "payment-status__icon-wrap--neutral"
  )

  const Icon =
    phase === "failure" || phase === "timedOut"
      ? Clock3
      : phase === "cancelled"
        ? XCircle
        : ShieldCheck

  return (
    <div className={wrapClassName}>
      <Icon className={iconClassName} aria-hidden />
    </div>
  )
}

function PaymentStatusScreen({
  phase,
  planName,
  planId = "starter",
  upgradeLikelyApplied = false,
  onRetry,
  isRetrying,
  onDismiss,
}: PaymentStatusScreenProps) {
  const shouldReduceMotion = useReducedMotion()
  const content = getPhaseContent(phase, planName, upgradeLikelyApplied)
  const unlockBenefits = getPremiumUnlockBenefits(planId)
  const isSuccess = phase === "success"
  const isFailure = phase === "failure" || phase === "timedOut"
  const isCancelled = phase === "cancelled"

  return (
    <div className="payment-status">
      <Card
        className={cn(
          "payment-status__card app-card-body hover:translate-y-0",
          isSuccess && "payment-status__card--success"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            className="payment-status__content"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhaseIcon
              phase={phase}
              tone={content.tone}
              shouldReduceMotion={shouldReduceMotion}
            />

            {content.eyebrow ? (
              <Text size="sm" className="payment-status__eyebrow">
                {content.eyebrow}
              </Text>
            ) : null}

            <Heading level={2} size="subsection" className="payment-status__title">
              {content.title}
            </Heading>

            <Text variant="muted" className="payment-status__description">
              {content.description}
            </Text>

            {content.reassurance ? (
              <Text size="sm" className="payment-status__reassurance">
                {content.reassurance}
              </Text>
            ) : null}

            {content.showProgress ? (
              <div className="payment-status__progress" aria-label="Verification progress">
                {PROGRESS_LABELS.map((label, index) => {
                  const isComplete =
                    content.progressStep != null && index < content.progressStep
                  const isCurrent = content.progressStep === index
                  const isPending = !isComplete && !isCurrent

                  return (
                    <div
                      key={label}
                      className={cn(
                        "payment-status__progress-step",
                        isComplete && "payment-status__progress-step--complete",
                        isCurrent && "payment-status__progress-step--current",
                        isPending && "payment-status__progress-step--pending"
                      )}
                    >
                      <span className="payment-status__progress-marker" aria-hidden>
                        {isComplete ? (
                          <Check className="payment-status__progress-check" />
                        ) : (
                          <span className="payment-status__progress-dot" />
                        )}
                      </span>
                      <div className="payment-status__progress-copy">
                        <Text size="sm" className="payment-status__progress-label">
                          {label}
                        </Text>
                        {isCurrent ? (
                          <Text size="sm" className="payment-status__progress-status">
                            In progress
                          </Text>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {isSuccess ? (
              <>
                <PremiumUnlockList
                  items={unlockBenefits}
                  animate
                  className="payment-status__unlock-list"
                />
                <div className="payment-status__actions app-button-row payment-status__actions--success">
                  <Button asChild>
                    <Link to={ROUTES.auditNew}>
                      Run your first Premium Audit
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link
                      to={`${ROUTES.billing}?activated=${encodeURIComponent(planId)}`}
                    >
                      View Billing
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to={`${ROUTES.dashboard}?activated=${encodeURIComponent(planId)}`}>
                      Dashboard
                    </Link>
                  </Button>
                </div>
              </>
            ) : null}

            {isFailure ? (
              <div className="payment-status__actions payment-status__actions--stacked">
                <div className="app-button-row payment-status__actions-primary">
                  <Button onClick={onRetry} disabled={isRetrying}>
                    {isRetrying ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Checking…
                      </>
                    ) : (
                      "Retry verification"
                    )}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={ROUTES.billing} onClick={onDismiss}>
                      Back to pricing
                    </Link>
                  </Button>
                </div>
                <div className="app-button-row payment-status__actions-secondary">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${EMAIL_BRANDING.company.supportEmail}`}>Contact support</a>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={ROUTES.billing} onClick={onDismiss}>
                      Return to Billing
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}

            {isCancelled ? (
              <div className="payment-status__actions app-button-row">
                <Button asChild>
                  <Link to={ROUTES.dashboard} onClick={onDismiss}>
                    Return to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.billing} onClick={onDismiss}>
                    Try again
                  </Link>
                </Button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}

export { PaymentStatusScreen }
