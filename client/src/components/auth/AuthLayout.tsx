import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { ConvertlyLogoLink } from "@/components/brand/ConvertlyLogo"
import { AuthPanelProvider } from "@/components/auth/AuthPanelProvider"
import { useAuthPanel } from "@/hooks/useAuthPanel"
import { AuthRotatingPanel } from "@/components/auth/AuthRotatingPanel"
import { VertlyRoot } from "@/features/vertly/components/VertlyRoot"
import { ROUTES } from "@/lib/routes"

function AuthLayoutContent() {
  const { closeLegal } = useAuthPanel()
  const location = useLocation()
  const isSignupRoute = location.pathname === ROUTES.signup
  const vertlyVariant = isSignupRoute ? "signup" : "guest-auth"

  // Reset legal overlay when navigating between auth routes (login / signup / forgot).
  useEffect(() => {
    closeLegal()
  }, [location.pathname, closeLegal])

  return (
    <>
      <div className="app-atmosphere min-h-dvh">
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

      <VertlyRoot variant={vertlyVariant} autoOpenSignupWelcome={isSignupRoute} />
    </>
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
