import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuthSession } from "@/components/auth/AuthSessionProvider"
import { PageLoading } from "@/components/feedback/PageState"
import { ROUTES } from "@/lib/routes"

function GuestRoute() {
  const location = useLocation()
  const { isLoading, isAuthenticated } = useAuthSession()

  if (isLoading) {
    return (
      <div className="app-atmosphere flex min-h-screen items-center justify-center">
        <PageLoading label="Checking session…" />
      </div>
    )
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? ROUTES.dashboard} replace />
  }

  return <Outlet />
}

export { GuestRoute }
