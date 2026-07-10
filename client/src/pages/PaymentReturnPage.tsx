import { useEffect, useMemo, useState } from "react"
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { PaymentStatusScreen } from "@/components/billing/PaymentStatusScreen"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { useAuthSession } from "@/hooks/useAuthSession"
import { usePaymentVerification } from "@/hooks/usePaymentVerification"
import {
  clearAllPaymentClientState,
  disposePaymentSession,
  readPendingCheckoutForUser,
} from "@/lib/checkoutPersistence"
import { navigateToBillingWithPaymentNotice } from "@/lib/paymentNoticeNavigation"
import { persistPaymentNotice } from "@/lib/paymentNoticePersistence"
import { markPremiumActivated } from "@/lib/premiumWelcomePersistence"
import { resolvePaymentReturnEntry } from "@/lib/paymentSession"
import { ROUTES } from "@/lib/routes"
import type { SubscriptionPlanId } from "@/lib/billingPlans"

function resolveCheckoutParam(
  checkoutParam: string | null
): "cancelled" | "failed" | "success" | null {
  if (checkoutParam === "canceled" || checkoutParam === "cancelled") {
    return "cancelled"
  }
  if (checkoutParam === "failed" || checkoutParam === "error") {
    return "failed"
  }
  if (checkoutParam === "success") {
    return "success"
  }
  return null
}

function PaymentReturnPage() {
  const { session, refreshSession } = useAuthSession()
  const userId = session?.userId ?? ""
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const checkoutParam = resolveCheckoutParam(searchParams.get("checkout"))
  const [forceVerify, setForceVerify] = useState(false)

  const entry = useMemo(() => {
    if (!userId) {
      return { pending: null, shouldVerify: false, shouldCancel: true }
    }

    if (checkoutParam === "cancelled") {
      return { pending: null, shouldVerify: false, shouldCancel: true }
    }

    if (checkoutParam === "failed") {
      return {
        pending: readPendingCheckoutForUser(userId),
        shouldVerify: false,
        shouldCancel: false,
      }
    }

    if (checkoutParam === "success") {
      const pending = readPendingCheckoutForUser(userId)
      return {
        pending,
        shouldVerify: true,
        shouldCancel: false,
      }
    }

    return resolvePaymentReturnEntry(userId)
  }, [checkoutParam, userId])

  const verifyActive = entry.shouldVerify || forceVerify

  const { phase, billing, planName, retry, isPolling } = usePaymentVerification({
    userId,
    pending: entry.pending,
    active: verifyActive,
    onSuccess: (billing) => {
      const planId = (entry.pending?.planId ?? billing.plan.planId) as SubscriptionPlanId
      markPremiumActivated({
        planId,
        planName,
        previousPlanId: entry.pending?.previousPlanId ?? "free",
        activatedAt: Date.now(),
      })
      persistPaymentNotice(userId, "subscription_activated", planName)
      disposePaymentSession("success")
      void refreshSession()
    },
    onTerminal: () => {
      disposePaymentSession("timedOut")
    },
  })

  useEffect(() => {
    if (!userId) return

    if (checkoutParam === "cancelled" || entry.shouldCancel) {
      disposePaymentSession("cancelled")
    }

    if (checkoutParam === "failed" && !forceVerify) {
      disposePaymentSession("failed")
    }
  }, [checkoutParam, entry.shouldCancel, forceVerify, userId])

  const header = useMemo(
    () => (
      <AppPageHeader
        eyebrow="Subscription"
        title="Payment status"
        description="We are confirming your subscription with our payment provider."
      />
    ),
    []
  )

  const loginRedirect = `${location.pathname}${location.search}`

  if (!userId) {
    return <Navigate to={ROUTES.login} replace state={{ from: loginRedirect }} />
  }

  if (checkoutParam === "cancelled" || entry.shouldCancel) {
    return (
      <AppPageShell header={header}>
        <PaymentStatusScreen
          phase="cancelled"
          planName={planName}
          planId={entry.pending?.planId}
          onDismiss={() => {
            clearAllPaymentClientState()
            navigate(ROUTES.billing, { replace: true })
          }}
        />
      </AppPageShell>
    )
  }

  if (checkoutParam === "failed" && !verifyActive && phase !== "success") {
    return (
      <AppPageShell header={header}>
        <PaymentStatusScreen
          phase="failure"
          planName={planName}
          planId={entry.pending?.planId}
          onRetry={() => {
            setForceVerify(true)
            retry()
          }}
          isRetrying={isPolling}
          onDismiss={() => {
            clearAllPaymentClientState()
            navigateToBillingWithPaymentNotice(
              navigate,
              userId,
              "verification_failed",
              planName
            )
          }}
        />
      </AppPageShell>
    )
  }

  if (phase === "timedOut") {
    return (
      <AppPageShell header={header}>
        <PaymentStatusScreen
          phase="timedOut"
          planName={planName}
          planId={entry.pending?.planId}
          onRetry={() => {
            setForceVerify(true)
            retry()
          }}
          isRetrying={isPolling}
          onDismiss={() => {
            clearAllPaymentClientState()
            navigateToBillingWithPaymentNotice(
              navigate,
              userId,
              "verification_delayed",
              planName
            )
          }}
        />
      </AppPageShell>
    )
  }

  if (phase === "success") {
    return (
      <AppPageShell header={header}>
        <PaymentStatusScreen
          phase="success"
          planName={planName}
          planId={entry.pending?.planId ?? (billing?.plan.planId as SubscriptionPlanId)}
        />
      </AppPageShell>
    )
  }

  if (!verifyActive) {
    return (
      <AppPageShell header={header}>
        <PaymentStatusScreen phase="idle" planName={planName} planId={entry.pending?.planId} />
      </AppPageShell>
    )
  }

  return (
    <AppPageShell header={header}>
      <PaymentStatusScreen
        phase={phase === "idle" ? "processing" : phase}
        planName={planName}
        planId={entry.pending?.planId}
        onRetry={() => {
          setForceVerify(true)
          retry()
        }}
        isRetrying={isPolling && phase === "processing"}
        onDismiss={() => {
          disposePaymentSession("cancelled")
          navigateToBillingWithPaymentNotice(navigate, userId, "payment_cancelled", planName)
        }}
      />
    </AppPageShell>
  )
}

export default PaymentReturnPage
