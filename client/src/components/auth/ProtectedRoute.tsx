import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuthSession } from "@/hooks/useAuthSession"
import { PageLoading } from "@/components/feedback/PageState"
import { shouldUseLocalAuth } from "@/lib/env"
import { isInAppPasswordRecoveryActive } from "@/lib/passwordRecoveryPersistence"
import { ROUTES } from "@/lib/routes"
import { sanitizePostLoginPath } from "@/lib/paymentSession"

const RECOVERY_RESOLVE_TIMEOUT_MS = 8000

function ProtectedRoute() {
  const location = useLocation()
  const { isLoading, isAuthenticated } = useAuthSession()
  const isInAppRecoveryFlow =
    !shouldUseLocalAuth() &&
    isInAppPasswordRecoveryActive() &&
    location.pathname.startsWith(ROUTES.settings)
  const recoveryAttempt = isInAppRecoveryFlow ? location.pathname : null
  const [timedOutKey, setTimedOutKey] = useState<string | null>(null)

  useEffect(() => {
    if (!recoveryAttempt) return

    const timer = window.setTimeout(() => {
      setTimedOutKey(recoveryAttempt)
    }, RECOVERY_RESOLVE_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [recoveryAttempt])

  const recoveryTimedOut =
    recoveryAttempt !== null && timedOutKey === recoveryAttempt
  const isAwaitingRecovery = isInAppRecoveryFlow && !isAuthenticated && !recoveryTimedOut

  if (isLoading || isAwaitingRecovery) {
    return (
      <div className="app-page container-premium [--container-max:90rem]">
        <PageLoading
          label={isAwaitingRecovery ? "Verifying recovery link…" : "Checking session…"}
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: sanitizePostLoginPath(`${location.pathname}${location.search}`) }}
      />
    )
  }

  return <Outlet />
}

export { ProtectedRoute }
