import {
  clearAllPaymentClientState,
  hasCheckoutExternalNavigationMarker,
  readPendingCheckout,
  readPendingCheckoutForUser,
} from "@/lib/checkoutPersistence"
import { persistPaymentNotice } from "@/lib/paymentNoticePersistence"
import { ROUTES } from "@/lib/routes"

export const PAYMENT_NOTICE_REFRESH_EVENT = "convertly:payment-notice-refresh"
export const PAYMENT_RESUME_VERIFICATION_PATH = ROUTES.billingReturn

function isBillingHandoffParam(checkoutParam: string | null): boolean {
  return checkoutParam === "success" || checkoutParam === "failed"
}

export function dispatchPaymentNoticeRefresh(): void {
  window.dispatchEvent(new CustomEvent(PAYMENT_NOTICE_REFRESH_EVENT))
}

/**
 * Pending checkout is only valid on PaymentReturnPage or during an explicit billing handoff.
 * When the user returns from Razorpay with the external marker still set, resume verification
 * instead of treating the session as abandoned.
 */
export function terminateAbandonedCheckoutSession(
  userId: string,
  pathname: string,
  checkoutParam: string | null,
  options?: { notify?: boolean }
): boolean {
  if (!userId || !readPendingCheckoutForUser(userId)) {
    return false
  }

  if (pathname === ROUTES.billingReturn) {
    return false
  }

  if (pathname === ROUTES.billing && isBillingHandoffParam(checkoutParam)) {
    return false
  }

  if (hasCheckoutExternalNavigationMarker()) {
    return false
  }

  clearAllPaymentClientState()
  persistPaymentNotice(userId, "payment_cancelled")

  if (options?.notify !== false) {
    dispatchPaymentNoticeRefresh()
  }

  return true
}

export function shouldResumeCheckoutVerification(
  userId: string,
  pathname: string,
  checkoutParam: string | null
): boolean {
  if (!userId || pathname === ROUTES.billingReturn) {
    return false
  }

  if (pathname === ROUTES.billing && isBillingHandoffParam(checkoutParam)) {
    return false
  }

  const pending = readPendingCheckoutForUser(userId)
  if (!pending || !hasCheckoutExternalNavigationMarker()) {
    return false
  }

  return true
}

function resumeCheckoutVerificationOnBillingPage(): void {
  const pathname = window.location.pathname
  if (pathname !== ROUTES.billing) return

  const params = new URLSearchParams(window.location.search)
  const checkoutParam = params.get("checkout")
  if (isBillingHandoffParam(checkoutParam)) return

  const pending = readPendingCheckout()
  if (!pending || !hasCheckoutExternalNavigationMarker()) return

  window.location.assign(PAYMENT_RESUME_VERIFICATION_PATH)
}

let paymentNoticeSyncInitialized = false

/** Handles BFCache restore where React effects do not re-run. */
export function initPaymentNoticeSync(): void {
  if (paymentNoticeSyncInitialized || typeof window === "undefined") {
    return
  }

  paymentNoticeSyncInitialized = true

  window.addEventListener("pageshow", () => {
    resumeCheckoutVerificationOnBillingPage()
  })
}
