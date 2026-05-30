import { Outlet } from "react-router-dom"

import { ConvertlyLogoLink } from "@/components/brand/ConvertlyLogo"
import { AuthLegalPanel } from "@/components/auth/AuthLegalPanel"
import { AuthPanelProvider, useAuthPanel } from "@/components/auth/AuthPanelContext"
import { AuthRotatingPanel } from "@/components/auth/AuthRotatingPanel"
import { ROUTES } from "@/lib/routes"

function AuthLayoutContent() {
  const { activeLegal } = useAuthPanel()

  return (
    <div className="app-atmosphere min-h-screen">
      <div className="grid min-h-screen w-full lg:grid-cols-[31fr_19fr]">
        <aside className="auth-showcase hidden min-h-screen flex-col lg:flex">
          <div className="auth-showcase-brand">
            <ConvertlyLogoLink to={ROUTES.home} />
          </div>

          <AuthRotatingPanel />
        </aside>

        <div className="auth-form-column">
          <div className="auth-form-column-mobile lg:hidden">
            <div className="auth-form-mobile-brand">
              <ConvertlyLogoLink to={ROUTES.home} />
            </div>

            {activeLegal ? (
              <div className="mb-6 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--surface)_46%,transparent)] p-5">
                <AuthLegalPanel view={activeLegal} />
              </div>
            ) : null}
          </div>

          <div className="auth-form-shell">
            <div className="auth-form-shell-inner">
              <Outlet />
            </div>
          </div>
        </div>
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
