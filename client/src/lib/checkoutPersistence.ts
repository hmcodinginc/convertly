import type { EffectivePlanId, SubscriptionPlanId } from "@/lib/billingPlans"
import { isSubscriptionActivated } from "@/lib/paymentActivation"
import { clearPremiumActivationSession } from "@/lib/premiumWelcomePersistence"
import { getItem, getJson, removeItem, setItem, setJson } from "@/services/storage/sessionStorageClient"
import type { BillingSnapshot } from "@/types/billing"

const PENDING_CHECKOUT_KEY = "convertly:checkout-pending"
const CHECKOUT_LEFT_KEY = "convertly:checkout-left-app"

/** Poll window after returning from the payment provider. */
export const CHECKOUT_VERIFICATION_WINDOW_MS = 90_000

export type PendingCheckout = {
  planId: SubscriptionPlanId
  userId: string
  previousPlanId: EffectivePlanId
  startedAt: number
}

export type PaymentTerminalOutcome = "success" | "cancelled" | "timedOut" | "failed"

export function setPendingCheckout(pending: PendingCheckout): void {
  setJson(PENDING_CHECKOUT_KEY, pending)
}

/** Always reads live sessionStorage — never cache in React state. */
export function readPendingCheckout(): PendingCheckout | null {
  const pending = getJson<PendingCheckout | null>(PENDING_CHECKOUT_KEY, null)
  if (!pending?.planId || !pending.userId) return null
  return pending
}

export function readPendingCheckoutForUser(userId: string): PendingCheckout | null {
  const pending = readPendingCheckout()
  if (!pending || pending.userId !== userId) return null
  return pending
}

export function clearPendingCheckout(): void {
  removeItem(PENDING_CHECKOUT_KEY)
}

export function markCheckoutExternalNavigation(): void {
  setItem(CHECKOUT_LEFT_KEY, String(Date.now()))
}

export function hasCheckoutExternalNavigationMarker(): boolean {
  return getItem(CHECKOUT_LEFT_KEY) != null
}

export function consumeCheckoutReturnFromExternal(): boolean {
  const raw = getItem(CHECKOUT_LEFT_KEY)
  removeItem(CHECKOUT_LEFT_KEY)
  return raw != null
}

export function clearCheckoutExternalNavigationMarker(): void {
  removeItem(CHECKOUT_LEFT_KEY)
}

/** Removes all ephemeral payment client state. Backend subscription is the only durable truth. */
export function clearAllPaymentClientState(): void {
  clearPendingCheckout()
  clearCheckoutExternalNavigationMarker()
  clearPremiumActivationSession()
}

export function hasPendingCheckout(userId?: string): boolean {
  const pending = readPendingCheckout()
  if (!pending) return false
  if (userId && pending.userId !== userId) return false
  return true
}

export function isPendingCheckoutVerifiable(pending: PendingCheckout): boolean {
  return Date.now() - pending.startedAt <= CHECKOUT_VERIFICATION_WINDOW_MS
}

/** Pending checkout for another signed-in user must never influence routing. */
export function clearForeignPendingCheckout(activeUserId: string): void {
  const pending = readPendingCheckout()
  if (!pending) return
  if (pending.userId !== activeUserId) {
    clearPendingCheckout()
  }
}

export function reconcilePendingCheckout(
  userId: string,
  billing: BillingSnapshot
): void {
  const pending = readPendingCheckoutForUser(userId)
  if (!pending) return

  if (isSubscriptionActivated(billing, pending)) {
    clearAllPaymentClientState()
    return
  }

  if (!isPendingCheckoutVerifiable(pending)) {
    clearPendingCheckout()
  }
}

export function disposePaymentSession(_outcome: PaymentTerminalOutcome): void {
  clearAllPaymentClientState()
}

/** @deprecated Use readPendingCheckoutForUser */
export function getPendingCheckoutForUser(userId: string): PendingCheckout | null {
  return readPendingCheckoutForUser(userId)
}

/** @deprecated Use readPendingCheckout */
export function getPendingCheckout(): PendingCheckout | null {
  return readPendingCheckout()
}
