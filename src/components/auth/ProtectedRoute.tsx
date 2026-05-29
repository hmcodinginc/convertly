import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { PageLoading } from "@/components/feedback/PageState"
import { ROUTES } from "@/lib/routes"
import * as authService from "@/services/authService"

function ProtectedRoute() {
  const location = useLocation()
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false

    authService.isAuthenticated().then((value) => {
      if (!cancelled) {
        setAuthenticated(value)
        setReady(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  if (!ready) {
    return (
      <div className="app-page container-premium [--container-max:90rem]">
        <PageLoading label="Checking session…" />
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to={ROUTES.home} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export { ProtectedRoute }
