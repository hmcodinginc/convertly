import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"

import {
  derivePaymentNotice,
  readPersistedPaymentNotice,
} from "@/lib/paymentNoticeState"
import {
  clearPaymentNotice,
  PAYMENT_NOTICE_TTL_MS,
} from "@/lib/paymentNoticePersistence"
import {
  initPaymentNoticeSync,
  PAYMENT_NOTICE_REFRESH_EVENT,
} from "@/lib/paymentNoticeSync"
import type { PaymentNoticeContent, PaymentNoticeKind } from "@/lib/paymentNoticeTypes"
import type { BillingSnapshot } from "@/types/billing"

initPaymentNoticeSync()

type UsePaymentNoticeOptions = {
  userId: string
  billing: BillingSnapshot | null
  billingLoadFailed: boolean
  loadingPlanId: string | null
}

type UsePaymentNoticeResult = {
  notice: PaymentNoticeContent | null
  dismiss: () => void
}

function usePaymentNotice({
  userId,
  billing,
  billingLoadFailed,
  loadingPlanId,
}: UsePaymentNoticeOptions): UsePaymentNoticeResult {
  const location = useLocation()
  const [dismissedKind, setDismissedKind] = useState<PaymentNoticeKind | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const checkoutParam = useMemo(
    () => new URLSearchParams(location.search).get("checkout"),
    [location.search]
  )

  const persistedNotice = useMemo(() => {
    if (!userId) return null
    return readPersistedPaymentNotice(userId)
  }, [location.key, location.pathname, refreshToken, userId])

  useEffect(() => {
    setDismissedKind(null)
  }, [userId])

  useEffect(() => {
    function handlePaymentNoticeRefresh() {
      setDismissedKind(null)
      setRefreshToken((value) => value + 1)
    }

    window.addEventListener(PAYMENT_NOTICE_REFRESH_EVENT, handlePaymentNoticeRefresh)
    return () =>
      window.removeEventListener(PAYMENT_NOTICE_REFRESH_EVENT, handlePaymentNoticeRefresh)
  }, [])

  useEffect(() => {
    if (!persistedNotice) return

    const remainingMs = PAYMENT_NOTICE_TTL_MS - (Date.now() - persistedNotice.createdAt)
    if (remainingMs <= 0) {
      clearPaymentNotice()
      setRefreshToken((value) => value + 1)
      return
    }

    const timerId = window.setTimeout(() => {
      clearPaymentNotice()
      setRefreshToken((value) => value + 1)
    }, remainingMs)

    return () => window.clearTimeout(timerId)
  }, [persistedNotice])

  const notice = derivePaymentNotice({
    userId,
    pathname: location.pathname,
    checkoutParam,
    billing,
    billingLoadFailed,
    loadingPlanId,
    dismissedKind,
    persistedNotice,
  })

  const dismiss = useCallback(() => {
    if (!notice) return
    setDismissedKind(notice.kind)
    clearPaymentNotice()
    setRefreshToken((value) => value + 1)
  }, [notice])

  return { notice, dismiss }
}

export { usePaymentNotice }
