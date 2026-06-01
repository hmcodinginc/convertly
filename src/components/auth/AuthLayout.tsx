import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { ConvertlyLogoLink } from "@/components/brand/ConvertlyLogo"
import { AuthPanelProvider, useAuthPanel } from "@/components/auth/AuthPanelContext"
import { AuthRotatingPanel } from "@/components/auth/AuthRotatingPanel"
import { ROUTES } from "@/lib/routes"

function AuthLayoutContent() {
  const { closeLegal } = useAuthPanel()
  const location = useLocation()

  // Reset legal overlay when navigating between auth routes (login / signup / forgot).
  useEffect(() => {
    closeLegal()
  }, [location.pathname, closeLegal])

  return (
    <div className="app-atmosphere min-h-screen">
      <div className="auth-layout-grid">
        <div className="auth-form-column">
          <div className="auth-form-column-mobile lg:hidden">
            <div className="auth-form-mobile-brand">
              <ConvertlyLogoLink to={ROUTES.home} />
            </div>
          </div>

          <div className="auth-form-shell">
            <div className="auth-form-shell-inner">
              <Outlet />
            </div>
          </div>
        </div>

        <aside className="auth-showcase flex flex-col">
          <div className="auth-showcase-brand hidden lg:block">
            <ConvertlyLogoLink to={ROUTES.home} />
          </div>

          <AuthRotatingPanel />
        </aside>
      </div>
    </div>
  )
}

function AuthLayout() {
  return (
    <AuthPanelProvider>
      <AuthLayoutContent />
    </AuthPanelProvider>
  )
}

export { AuthLayout }
