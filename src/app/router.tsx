import { BrowserRouter, Route, Routes } from "react-router-dom"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ROUTES } from "@/lib/routes"
import AuditDetailPage from "@/pages/AuditDetailPage"
import AuditsPage from "@/pages/AuditsPage"
import BillingPage from "@/pages/BillingPage"
import DashboardPage from "@/pages/DashboardPage"
import HomePage from "@/pages/HomePage"
import NewAuditPage from "@/pages/NewAuditPage"
import SettingsPage from "@/pages/SettingsPage"
import WorkspacePage from "@/pages/WorkspacePage"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.auditNew} element={<NewAuditPage />} />
            <Route path={ROUTES.audits} element={<AuditsPage />} />
            <Route path={ROUTES.auditDetail} element={<AuditDetailPage />} />
            <Route path={ROUTES.workspace} element={<WorkspacePage />} />
            <Route path={ROUTES.billing} element={<BillingPage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export { AppRouter }
