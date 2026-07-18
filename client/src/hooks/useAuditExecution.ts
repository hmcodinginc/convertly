import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"

import {
  deriveAuditExecutionState,
  isExecutionRunning,
} from "@/services/audit/execution/deriveAuditExecutionState"
import * as auditService from "@/services/auditService"
import { isBotProtectionFailure } from "@/lib/auditFailureDetection"
import {
  AUDIT_INTERRUPTED_MESSAGE,
  isAuditStale,
} from "@/lib/auditReliability"
import type { AuditDetail } from "@/types/audit"
import type { AuditExecutionState } from "@/types/auditExecution"
import type { AuditSessionData } from "@/types/auditEngine"

type AuditExecutionFailureOutcome = "bot_protection" | "interrupted" | "generic" | null

type UseAuditExecutionOptions = {
  auditId: string
  pollIntervalMs?: number
  enabled?: boolean
  onCompleted?: (detail: AuditDetail) => void
  onFailed?: (errorMessage?: string) => void
}

type UseAuditExecutionResult = {
  state: AuditExecutionState | null
  displayPercentage: number
  sessionData: AuditSessionData | null
  isLoading: boolean
  completionDetail: AuditDetail | null
  showCompletion: boolean
  failureOutcome: AuditExecutionFailureOutcome
  failureMessage: string | null
  dismissCompletion: () => void
}

function useAuditExecution({
  auditId,
  pollIntervalMs = 1000,
  enabled = true,
  onCompleted,
  onFailed,
}: UseAuditExecutionOptions): UseAuditExecutionResult {
  const shouldReduceMotion = useReducedMotion()
  const [sessionData, setSessionData] = useState<AuditSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [displayPercentage, setDisplayPercentage] = useState(0)
  const [insightTick, setInsightTick] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [completionDetail, setCompletionDetail] = useState<AuditDetail | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [failureOutcome, setFailureOutcome] = useState<AuditExecutionFailureOutcome>(null)
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const [clientInterrupted, setClientInterrupted] = useState(false)

  const targetPercentageRef = useRef(0)
  const completionHandledRef = useRef(false)
  const onCompletedRef = useRef(onCompleted)
  const onFailedRef = useRef(onFailed)

  onCompletedRef.current = onCompleted
  onFailedRef.current = onFailed

  const markInterrupted = useCallback(
    (message?: string | null) => {
      if (completionHandledRef.current) return
      completionHandledRef.current = true
      setClientInterrupted(true)
      setFailureOutcome("interrupted")
      setFailureMessage(message?.trim() || AUDIT_INTERRUPTED_MESSAGE)
      // Persist Failed so the row cannot remain Running forever if cron is delayed.
      void auditService.markAuditInterrupted(auditId)
    },
    [auditId]
  )

  const fetchSession = useCallback(async () => {
    const data = await auditService.getAuditSessionDataById(auditId)
    if (data) {
      setSessionData(data)

      if (
        isExecutionRunning(data) &&
        isAuditStale(data.session.updatedAt)
      ) {
        markInterrupted(data.session.errorMessage ?? AUDIT_INTERRUPTED_MESSAGE)
      }
    }
    setIsLoading(false)
    return data
  }, [auditId, markInterrupted])

  useEffect(() => {
    if (!enabled || !auditId) return
    setIsLoading(true)
    completionHandledRef.current = false
    setFailureOutcome(null)
    setFailureMessage(null)
    setClientInterrupted(false)
    void fetchSession()
  }, [auditId, enabled, fetchSession])

  useEffect(() => {
    if (!enabled || !auditId || !sessionData || clientInterrupted) return
    if (!isExecutionRunning(sessionData) && sessionData.session.status !== "failed") return

    const interval = window.setInterval(() => {
      void fetchSession()
    }, pollIntervalMs)

    return () => window.clearInterval(interval)
  }, [
    auditId,
    clientInterrupted,
    enabled,
    fetchSession,
    pollIntervalMs,
    sessionData?.session.status,
  ])

  useEffect(() => {
    if (!enabled || clientInterrupted) return

    const interval = window.setInterval(() => {
      setInsightTick((tick) => tick + 1)
    }, 18_000)

    return () => window.clearInterval(interval)
  }, [clientInterrupted, enabled])

  const state = useMemo(() => {
    if (!sessionData) return null
    return deriveAuditExecutionState(sessionData, {
      insightTick,
      completing,
    })
  }, [sessionData, insightTick, completing])

  useEffect(() => {
    if (!state) return
    targetPercentageRef.current = state.percentage
  }, [state?.percentage])

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayPercentage(targetPercentageRef.current)
      return
    }

    let frame = 0
    const animate = () => {
      setDisplayPercentage((current) => {
        const target = targetPercentageRef.current
        if (current >= target) return target
        const delta = Math.max(0.4, (target - current) * 0.08)
        return Math.min(target, current + delta)
      })
      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [shouldReduceMotion, state?.percentage])

  useEffect(() => {
    if (!sessionData || completionHandledRef.current) return

    const { status, errorMessage, updatedAt } = sessionData.session

    if (status === "failed") {
      completionHandledRef.current = true

      if (isBotProtectionFailure(errorMessage)) {
        setFailureOutcome("bot_protection")
        setFailureMessage(errorMessage ?? null)
        return
      }

      const interrupted =
        (errorMessage ?? "").includes("interrupted") || isAuditStale(updatedAt)

      if (interrupted) {
        setFailureOutcome("interrupted")
        setFailureMessage(errorMessage?.trim() || AUDIT_INTERRUPTED_MESSAGE)
        return
      }

      setFailureOutcome("generic")
      setFailureMessage(errorMessage ?? null)
      onFailedRef.current?.(errorMessage)
      return
    }

    if (status !== "completed") return

    completionHandledRef.current = true
    setCompleting(true)
    targetPercentageRef.current = 100
    setDisplayPercentage(100)

    void (async () => {
      const detail = await auditService.getAuditDetail(auditId)
      if (!detail) return

      setCompletionDetail(detail)
      setShowCompletion(true)

      window.setTimeout(() => {
        onCompletedRef.current?.(detail)
      }, 1000)
    })()
  }, [auditId, sessionData])

  const dismissCompletion = useCallback(() => {
    setShowCompletion(false)
  }, [])

  return {
    state,
    displayPercentage: Math.round(displayPercentage),
    sessionData,
    isLoading,
    completionDetail,
    showCompletion,
    failureOutcome,
    failureMessage,
    dismissCompletion,
  }
}

export { useAuditExecution }
export type { UseAuditExecutionOptions, UseAuditExecutionResult }
