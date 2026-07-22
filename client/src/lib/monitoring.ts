import * as Sentry from "@sentry/react"

import { env } from "@/lib/env"

/**
 * Error monitoring (Sentry). Initialized only in production builds with a
 * configured DSN, so development behavior is unchanged. All capture helpers
 * are safe no-ops when monitoring is not initialized.
 */
export function initMonitoring(): void {
  if (!import.meta.env.PROD || !env.sentryDsn) return

  Sentry.init({
    dsn: env.sentryDsn,
    environment: "production",
    sendDefaultPii: false,
  })
}

/** Capture a handled error with optional context (no-op when uninitialized). */
export function captureMonitoredError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  Sentry.captureException(error, context ? { extra: context } : undefined)
}

/** Associate subsequent events with the signed-in user (id only, no PII). */
export function setMonitoringUser(userId: string | null): void {
  Sentry.setUser(userId ? { id: userId } : null)
}

export const MonitoringErrorBoundary = Sentry.ErrorBoundary
