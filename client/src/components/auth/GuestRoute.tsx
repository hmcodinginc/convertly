import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuthSession } from "@/hooks/useAuthSession"
import { PageLoading } from "@/components/feedback/PageState"
import { isPasswordRecoveryInProgressElsewhere } from "@/lib/passwordRecoveryPersistence"
import { ROUTES } from "@/lib/routes"

const GUEST_AUTH_PATHS = new Set<string>([
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
])

function isGuestAuthPath(pathname: string): boolean {
  return GUEST_AUTH_PATHS.has(pathname)
}

function GuestRoute() {
  const location = useLocation()
  const { isLoading, isAuthenticated } = useAuthSession()

  if (isLoading) {
    return (
      <div className="app-atmosphere flex min-h-dvh items-center justify-center">
        <PageLoading label="Checking session…" />
      </div>
    )
  }

  if (
    isAuthenticated &&
    isGuestAuthPath(location.pathname) &&
    isPasswordRecoveryInProgressElsewhere()
  ) {
    return <Outlet />
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? ROUTES.dashboard} replace />
  }

  return <Outlet />
}

export { GuestRoute }
