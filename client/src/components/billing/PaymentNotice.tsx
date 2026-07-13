import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  X,
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import type { PaymentNoticeContent } from "@/lib/paymentNoticeTypes"
import { cn } from "@/lib/utils"

import "./payment-notice.css"

type PaymentNoticeProps = {
  notice: PaymentNoticeContent
  onDismiss?: () => void
  className?: string
}

function NoticeIcon({ kind }: { kind: PaymentNoticeContent["kind"] }) {
  switch (kind) {
    case "redirecting_to_razorpay":
    case "waiting_for_payment_approval":
    case "waiting_for_webhook_verification":
    case "plan_upgrade_processing":
      return <Loader2 className="payment-notice__icon animate-spin" aria-hidden />
    case "checkout_cancelled":
    case "payment_cancelled":
    case "verification_delayed":
      return <AlertTriangle className="payment-notice__icon" aria-hidden />
    case "payment_received":
      return <CreditCard className="payment-notice__icon" aria-hidden />
    case "subscription_activated":
    case "plan_change_cancelled":
      return <CheckCircle2 className="payment-notice__icon" aria-hidden />
    case "verification_failed":
    case "payment_service_unavailable":
      return <AlertCircle className="payment-notice__icon" aria-hidden />
    default:
      return <Clock3 className="payment-notice__icon" aria-hidden />
  }
}

function PaymentNotice({ notice, onDismiss, className }: PaymentNoticeProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={cn("payment-notice", `payment-notice--${notice.tone}`, className)}
      role="status"
      aria-live="polite"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="payment-notice__icon-wrap" aria-hidden>
        <NoticeIcon kind={notice.kind} />
      </div>

      <div className="payment-notice__body">
        <p className="payment-notice__title">{notice.title}</p>
        <p className="payment-notice__description">{notice.description}</p>
      </div>

      {notice.dismissible && onDismiss ? (
        <button
          type="button"
          className="payment-notice__dismiss"
          aria-label="Dismiss payment notice"
          onClick={onDismiss}
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </motion.div>
  )
}

export { PaymentNotice }
export type { PaymentNoticeProps }
