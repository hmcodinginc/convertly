import type { PaymentNoticeKind } from "@/lib/paymentNoticeTypes"
import { getJson, removeItem, setJson } from "@/services/storage/sessionStorageClient"

const PAYMENT_NOTICE_KEY = "convertly:payment-notice"

export const PAYMENT_NOTICE_TTL_MS = 30_000

export type PersistedPaymentNotice = {
  kind: PaymentNoticeKind
  planName?: string
  userId: string
  createdAt: number
}

export function persistPaymentNotice(
  userId: string,
  kind: PaymentNoticeKind,
  planName?: string
): void {
  setJson<PersistedPaymentNotice>(PAYMENT_NOTICE_KEY, {
    kind,
    planName,
    userId,
    createdAt: Date.now(),
  })
}

export function peekPaymentNotice(userId: string): PersistedPaymentNotice | null {
  const notice = getJson<PersistedPaymentNotice | null>(PAYMENT_NOTICE_KEY, null)
  if (!notice?.kind || notice.userId !== userId) return null

  if (Date.now() - notice.createdAt > PAYMENT_NOTICE_TTL_MS) {
    clearPaymentNotice()
    return null
  }

  return notice
}

export function clearPaymentNotice(): void {
  removeItem(PAYMENT_NOTICE_KEY)
}
