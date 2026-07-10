import { getPlanEntitlement } from "@/lib/billingPlans"
import {
  readPendingCheckoutForUser,
  type PendingCheckout,
} from "@/lib/checkoutPersistence"
import { isSubscriptionActivated } from "@/lib/paymentActivation"
import {
  buildPaymentNoticeContent,
  type PaymentNoticeContent,
  type PaymentNoticeKind,
} from "@/lib/paymentNoticeTypes"
import {
  peekPaymentNotice,
  type PersistedPaymentNotice,
} from "@/lib/paymentNoticePersistence"
import type { BillingSnapshot } from "@/types/billing"

type DerivePaymentNoticeInput = {
  userId: string
  pathname: string
  checkoutParam: string | null
  billing: BillingSnapshot | null
  billingLoadFailed: boolean
  loadingPlanId: string | null
  dismissedKind: PaymentNoticeKind | null
  persistedNotice: PersistedPaymentNotice | null
}

function fromKind(kind: PaymentNoticeKind, planName?: string): PaymentNoticeContent {
  return buildPaymentNoticeContent(kind, planName)
}

function deriveSubscriptionActivatedNotice(
  billing: BillingSnapshot,
  pending: PendingCheckout
): PaymentNoticeContent | null {
  if (!isSubscriptionActivated(billing, pending)) {
    return null
  }

  const planName = getPlanEntitlement(pending.planId).name
  return fromKind("subscription_activated", planName)
}

export function derivePaymentNotice(input: DerivePaymentNoticeInput): PaymentNoticeContent | null {
  const {
    userId,
    billing,
    billingLoadFailed,
    loadingPlanId,
    dismissedKind,
    persistedNotice,
  } = input

  if (loadingPlanId) {
    const content = fromKind("redirecting_to_razorpay")
    return dismissedKind === content.kind ? null : content
  }

  if (billingLoadFailed || (billing && !billing.paymentsConfigured)) {
    const content = fromKind("payment_service_unavailable")
    return dismissedKind === content.kind ? null : content
  }

  let effectivePersistedNotice = persistedNotice

  if (billing) {
    const pending = readPendingCheckoutForUser(userId)
    if (pending) {
      const activatedNotice = deriveSubscriptionActivatedNotice(billing, pending)
      if (activatedNotice && dismissedKind !== activatedNotice.kind) {
        return activatedNotice
      }
    }
  }

  if (effectivePersistedNotice && dismissedKind !== effectivePersistedNotice.kind) {
    return fromKind(effectivePersistedNotice.kind, effectivePersistedNotice.planName)
  }

  return null
}

export function readPersistedPaymentNotice(userId: string): PersistedPaymentNotice | null {
  return peekPaymentNotice(userId)
}
