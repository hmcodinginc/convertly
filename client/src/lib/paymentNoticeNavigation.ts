import type { NavigateFunction } from "react-router-dom"

import { persistPaymentNotice } from "@/lib/paymentNoticePersistence"
import type { PaymentNoticeKind } from "@/lib/paymentNoticeTypes"
import { ROUTES } from "@/lib/routes"

export function navigateToBillingWithPaymentNotice(
  navigate: NavigateFunction,
  userId: string,
  kind: PaymentNoticeKind,
  planName?: string
): void {
  persistPaymentNotice(userId, kind, planName)
  navigate(ROUTES.billing, { replace: true })
}
