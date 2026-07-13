import { useCallback, useEffect, useRef, useState } from "react"

import type { PendingCheckout } from "@/lib/checkoutPersistence"
import {
  getCheckoutVerificationDeadline,
  markCheckoutVerificationStarted,
  readCheckoutVerificationStartedAt,
} from "@/lib/checkoutPersistence"
import { getPlanEntitlement } from "@/lib/billingPlans"
import { isCheckoutVerificationComplete } from "@/lib/paymentActivation"
import * as billingService from "@/services/billingService"
import type { BillingSnapshot } from "@/types/billing"

export type PaymentVerificationPhase =
  | "idle"
  | "processing"
  | "verifying"
  | "waiting"
  | "success"
  | "failure"
  | "timedOut"
  | "cancelled"

type UsePaymentVerificationOptions = {
  userId: string
  pending: PendingCheckout | null
  active: boolean
  onSuccess?: (billing: BillingSnapshot) => void
  onTerminal?: () => void
}

type UsePaymentVerificationResult = {
  phase: PaymentVerificationPhase
  billing: BillingSnapshot | null
  planName: string
  retry: () => void
  isPolling: boolean
}

const POLL_INTERVAL_MS = 2_000

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }

    const timeoutId = window.setTimeout(resolve, ms)
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId)
        resolve()
      },
      { once: true }
    )
  })
}

function resolvePhaseFromElapsed(elapsedMs: number): PaymentVerificationPhase {
  if (elapsedMs < 2_500) return "processing"
  if (elapsedMs < 12_000) return "verifying"
  return "waiting"
}

async function fetchBillingSnapshot(userId: string): Promise<BillingSnapshot | null> {
  try {
    return await billingService.getBilling(userId)
  } catch {
    return null
  }
}

function usePaymentVerification({
  userId,
  pending,
  active,
  onSuccess,
  onTerminal,
}: UsePaymentVerificationOptions): UsePaymentVerificationResult {
  const [phase, setPhase] = useState<PaymentVerificationPhase>("idle")
  const [billing, setBilling] = useState<BillingSnapshot | null>(null)
  const [attempt, setAttempt] = useState(0)

  const onSuccessRef = useRef(onSuccess)
  const onTerminalRef = useRef(onTerminal)
  onSuccessRef.current = onSuccess
  onTerminalRef.current = onTerminal

  const planName =
    billing?.plan.name ??
    (pending ? getPlanEntitlement(pending.planId).name : "Premium")

  useEffect(() => {
    if (!active) {
      setPhase("idle")
      return
    }

    if (!userId) {
      setPhase("timedOut")
      onTerminalRef.current?.()
      return
    }

    markCheckoutVerificationStarted()

    const abortController = new AbortController()
    let disposed = false

    async function resolveSuccess(snapshot: BillingSnapshot): Promise<void> {
      setBilling(snapshot)
      setPhase("success")
      onSuccessRef.current?.(snapshot)
    }

    async function poll(): Promise<void> {
      setPhase("processing")

      while (!disposed && !abortController.signal.aborted) {
        const verificationStartedAt = readCheckoutVerificationStartedAt() ?? Date.now()
        const deadline = getCheckoutVerificationDeadline()

        if (Date.now() >= deadline) {
          const finalSnapshot = await fetchBillingSnapshot(userId)
          if (disposed || abortController.signal.aborted) return

          if (finalSnapshot && isCheckoutVerificationComplete(finalSnapshot, pending)) {
            await resolveSuccess(finalSnapshot)
            return
          }

          setPhase("timedOut")
          onTerminalRef.current?.()
          return
        }

        const elapsed = Date.now() - verificationStartedAt
        setPhase(resolvePhaseFromElapsed(elapsed))

        const snapshot = await fetchBillingSnapshot(userId)
        if (disposed || abortController.signal.aborted) return

        if (snapshot) {
          setBilling(snapshot)

          if (isCheckoutVerificationComplete(snapshot, pending)) {
            await resolveSuccess(snapshot)
            return
          }
        }

        await sleep(POLL_INTERVAL_MS, abortController.signal)
      }
    }

    void poll()

    return () => {
      disposed = true
      abortController.abort()
    }
  }, [active, attempt, pending, userId])

  const retry = useCallback(() => {
    markCheckoutVerificationStarted()
    setBilling(null)
    setPhase("processing")
    setAttempt((value) => value + 1)
  }, [])

  const isPolling =
    phase === "processing" || phase === "verifying" || phase === "waiting"

  return {
    phase,
    billing,
    planName,
    retry,
    isPolling,
  }
}

export { usePaymentVerification }
