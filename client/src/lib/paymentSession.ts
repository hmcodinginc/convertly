import {
  clearAllPaymentClientState,
  clearForeignPendingCheckout,
  consumeCheckoutReturnFromExternal,
  hasCheckoutExternalNavigationMarker,
  isPendingCheckoutVerifiable,
  readPendingCheckoutForUser,
  type PendingCheckout,
} from "@/lib/checkoutPersistence"
import { clearPaymentNotice } from "@/lib/paymentNoticePersistence"
import { terminateAbandonedCheckoutSession } from "@/lib/paymentNoticeSync"
import { ROUTES } from "@/lib/routes"

export function handleAuthSessionPaymentBoundary(
  previousUserId: string | null | undefined,
  nextUserId: string | null | undefined
): void {
  if (!nextUserId) {
    clearAllPaymentClientState()
    clearPaymentNotice()
    return
  }

  if (previousUserId && previousUserId !== nextUserId) {
    clearAllPaymentClientState()
    clearPaymentNotice()
    return
  }

  clearForeignPendingCheckout(nextUserId)
}

/**
 * Pending checkout may only exist on PaymentReturnPage (or during a billing→return handoff).
 * Any other route with pending state is an abandoned checkout and must be disposed.
 */
export function abandonPendingCheckoutOutsideVerificationScope(
  userId: string,
  pathname: string,
  checkoutParam: string | null
): boolean {
  return terminateAbandonedCheckoutSession(userId, pathname, checkoutParam)
}

export function resolvePaymentReturnEntry(
  userId: string
): {
  pending: PendingCheckout | null
  shouldVerify: boolean
  shouldCancel: boolean
} {
  const pending = readPendingCheckoutForUser(userId)
  const hasExternalMarker = hasCheckoutExternalNavigationMarker()

  if (pending && hasExternalMarker) {
    consumeCheckoutReturnFromExternal()
    if (isPendingCheckoutVerifiable(pending)) {
      return { pending, shouldVerify: true, shouldCancel: false }
    }
    return { pending, shouldVerify: false, shouldCancel: true }
  }

  if (pending && isPendingCheckoutVerifiable(pending)) {
    return { pending, shouldVerify: true, shouldCancel: false }
  }

  if (!pending && hasExternalMarker) {
    consumeCheckoutReturnFromExternal()
    return { pending: null, shouldVerify: true, shouldCancel: false }
  }

  if (!pending) {
    return { pending: null, shouldVerify: false, shouldCancel: true }
  }

  return { pending, shouldVerify: false, shouldCancel: true }
}

export function isPaymentReturnRoute(pathname: string): boolean {
  return pathname === ROUTES.billingReturn
}

export function isSafePostLoginRedirect(pathname: string): boolean {
  return pathname.startsWith("/")
}

export function sanitizePostLoginPath(path: string | undefined): string {
  if (!path || !path.startsWith("/")) {
    return ROUTES.dashboard
  }
  return path
}
