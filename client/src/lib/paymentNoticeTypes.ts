export type PaymentNoticeKind =
  | "checkout_cancelled"
  | "payment_cancelled"
  | "redirecting_to_razorpay"
  | "waiting_for_payment_approval"
  | "payment_received"
  | "waiting_for_webhook_verification"
  | "verification_delayed"
  | "subscription_activated"
  | "verification_failed"
  | "payment_service_unavailable"
  | "plan_upgrade_processing"
  | "plan_upgrade_delayed"
  | "plan_downgrade_scheduled"
  | "plan_change_cancelled"

export type PaymentNoticeTone = "yellow" | "blue" | "purple" | "green" | "red" | "orange"

export type PaymentNoticeContent = {
  kind: PaymentNoticeKind
  title: string
  description: string
  tone: PaymentNoticeTone
  dismissible: boolean
  terminal: boolean
}

export const TERMINAL_PAYMENT_NOTICE_KINDS = new Set<PaymentNoticeKind>([
  "checkout_cancelled",
  "payment_cancelled",
  "payment_received",
  "verification_delayed",
  "subscription_activated",
  "verification_failed",
  "payment_service_unavailable",
  "plan_upgrade_delayed",
  "plan_downgrade_scheduled",
  "plan_change_cancelled",
])

export function isTerminalPaymentNotice(kind: PaymentNoticeKind): boolean {
  return TERMINAL_PAYMENT_NOTICE_KINDS.has(kind)
}

export function buildPaymentNoticeContent(
  kind: PaymentNoticeKind,
  planName?: string
): PaymentNoticeContent {
  switch (kind) {
    case "checkout_cancelled":
      return {
        kind,
        title: "Checkout cancelled",
        description: "No changes were made.",
        tone: "yellow",
        dismissible: true,
        terminal: true,
      }
    case "payment_cancelled":
      return {
        kind,
        title: "Subscription was cancelled",
        description:
          "Checkout was closed before payment completed. Your plan is unchanged — you can try again whenever you're ready.",
        tone: "yellow",
        dismissible: true,
        terminal: true,
      }
    case "redirecting_to_razorpay":
      return {
        kind,
        title: "Redirecting to Razorpay",
        description: "Opening secure checkout. Complete payment in the Razorpay window when it appears.",
        tone: "blue",
        dismissible: false,
        terminal: false,
      }
    case "waiting_for_payment_approval":
      return {
        kind,
        title: "Waiting for payment approval",
        description:
          "Finish payment in the Razorpay window. This page will update once your subscription is confirmed.",
        tone: "blue",
        dismissible: false,
        terminal: false,
      }
    case "payment_received":
      return {
        kind,
        title: "Payment received",
        description: planName
          ? `We received your payment for ${planName}. Activating your subscription now.`
          : "We received your payment. Activating your subscription now.",
        tone: "purple",
        dismissible: true,
        terminal: true,
      }
    case "waiting_for_webhook_verification":
      return {
        kind,
        title: "Waiting for webhook verification",
        description:
          "Confirming your subscription with our payment provider. This usually takes less than a minute.",
        tone: "purple",
        dismissible: false,
        terminal: false,
      }
    case "verification_delayed":
      return {
        kind,
        title: "Verification delayed",
        description:
          "Confirmation is taking longer than expected. Your plan will update automatically once verified — retry checkout if needed.",
        tone: "orange",
        dismissible: true,
        terminal: true,
      }
    case "subscription_activated":
      return {
        kind,
        title: "Subscription activated",
        description: planName
          ? `Your ${planName} plan is now active. Premium audit allowance is unlocked.`
          : "Your subscription is now active. Premium audit allowance is unlocked.",
        tone: "green",
        dismissible: true,
        terminal: true,
      }
    case "verification_failed":
      return {
        kind,
        title: "Verification failed",
        description:
          "We couldn't confirm this checkout with our payment provider. Your plan was not changed — retry payment below.",
        tone: "red",
        dismissible: true,
        terminal: true,
      }
    case "payment_service_unavailable":
      return {
        kind,
        title: "Payment service unavailable",
        description:
          "Checkout is temporarily unavailable. Refresh this page or try again in a few minutes.",
        tone: "red",
        dismissible: true,
        terminal: true,
      }
    case "plan_upgrade_processing":
      return {
        kind,
        title: "Processing upgrade",
        description: planName
          ? `Confirming your upgrade to ${planName}. This usually takes less than a minute.`
          : "Confirming your plan upgrade with our payment provider.",
        tone: "purple",
        dismissible: false,
        terminal: false,
      }
    case "plan_upgrade_delayed":
      return {
        kind,
        title: "Upgrade confirmation delayed",
        description: planName
          ? `Your upgrade to ${planName} is still processing. Your plan will update automatically once confirmed.`
          : "Your upgrade is still processing. Your plan will update automatically once confirmed.",
        tone: "orange",
        dismissible: true,
        terminal: true,
      }
    case "plan_downgrade_scheduled":
      return {
        kind,
        title: "Downgrade scheduled",
        description: planName
          ? `Your plan will change to ${planName} at the end of the current billing period. Current limits stay active until then.`
          : "Your plan will change at the end of the current billing period.",
        tone: "blue",
        dismissible: true,
        terminal: true,
      }
    case "plan_change_cancelled":
      return {
        kind,
        title: "Scheduled change cancelled",
        description: "Your scheduled plan change was cancelled. Your current plan continues unchanged.",
        tone: "green",
        dismissible: true,
        terminal: true,
      }
  }
}
