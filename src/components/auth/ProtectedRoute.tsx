import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuthSession } from "@/components/auth/AuthSessionProvider"
import { PageLoading } from "@/components/feedback/PageState"
import { ROUTES } from "@/lib/routes"

function ProtectedRoute() {
  const location = useLocation()
  const { isLoading, isAuthenticated } = useAuthSession()

  if (isLoading) {
    return (
      <div className="app-page container-premium [--container-max:90rem]">
        <PageLoading label="Checking session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}

export { ProtectedRoute }
