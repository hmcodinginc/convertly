import { useEffect, useLayoutEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { useAuthSession } from "@/hooks/useAuthSession"
import {
  readPendingCheckoutForUser,
  reconcilePendingCheckout,
} from "@/lib/checkoutPersistence"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import {
  shouldResumeCheckoutVerification,
  terminateAbandonedCheckoutSession,
} from "@/lib/paymentNoticeSync"
import { isPaymentReturnRoute } from "@/lib/paymentSession"
import { ROUTES } from "@/lib/routes"
import * as billingService from "@/services/billingService"

function isBillingHandoffParam(checkoutParam: string | null): boolean {
  return checkoutParam === "success" || checkoutParam === "failed"
}

/**
 * Keeps payment client state aligned with auth identity and backend subscription truth.
 * Verification polling only runs on PaymentReturnPage — this component never starts polling.
 */
function PaymentSessionBoundary() {
  const { session } = useAuthSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = session?.userId ?? null
  const checkoutParam = searchParams.get("checkout")

  useLayoutEffect(() => {
    if (!userId) return
    if (isPaymentReturnRoute(location.pathname)) return
    if (location.pathname === ROUTES.billing && isBillingHandoffParam(checkoutParam)) return

    if (shouldResumeCheckoutVerification(userId, location.pathname, checkoutParam)) {
      navigate(ROUTES.billingReturn, { replace: true })
      return
    }

    if (
      terminateAbandonedCheckoutSession(userId, location.pathname, checkoutParam) &&
      location.pathname === ROUTES.billing
    ) {
      navigate(ROUTES.billing, { replace: true })
    }
  }, [checkoutParam, location.pathname, navigate, userId])

  useEffect(() => {
    if (!userId || !isBusinessFoundationEnabled()) return

    void billingService
      .getBilling(userId)
      .then((billing) => {
        reconcilePendingCheckout(userId, billing)
      })
      .catch(() => {
        /* billing unavailable */
      })
  }, [location.pathname, userId])

  return null
}

export { PaymentSessionBoundary }
