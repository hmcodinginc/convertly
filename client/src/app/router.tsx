import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthLayout } from "@/components/auth/AuthLayout"
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider"
import { GuestRoute } from "@/components/auth/GuestRoute"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/components/layout/MarketingLayout"
import { SettingsLayout } from "@/components/settings/SettingsLayout"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ROUTES } from "@/lib/routes"
import AuditDetailPage from "@/pages/AuditDetailPage"
import AuditsPage from "@/pages/AuditsPage"
import BillingPage from "@/pages/BillingPage"
import PaymentReturnPage from "@/pages/PaymentReturnPage"
import DashboardPage from "@/pages/DashboardPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import NewAuditPage from "@/pages/NewAuditPage"
import ProfilePage from "@/pages/ProfilePage"
import SampleReportPage from "@/pages/SampleReportPage"
import SettingsDangerZonePage from "@/pages/settings/SettingsDangerZonePage"
import SettingsNotificationsPage from "@/pages/settings/SettingsNotificationsPage"
import SettingsPreferencesPage from "@/pages/settings/SettingsPreferencesPage"
import SettingsSecurityPage from "@/pages/settings/SettingsSecurityPage"
import SignupPage from "@/pages/SignupPage"
import WorkspacePage from "@/pages/WorkspacePage"

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthSessionProvider>
        <Routes>
        <Route element={<MarketingLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.sampleReport} element={<SampleReportPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.signup} element={<SignupPage />} />
            <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.auditNew} element={<NewAuditPage />} />
            <Route path={ROUTES.audits} element={<AuditsPage />} />
            <Route path={ROUTES.auditDetail} element={<AuditDetailPage />} />
            <Route path={ROUTES.workspace} element={<WorkspacePage />} />
            <Route path={ROUTES.billingReturn} element={<PaymentReturnPage />} />
            <Route path={ROUTES.billing} element={<BillingPage />} />
            <Route path="/profile" element={<Navigate to={ROUTES.profile} replace />} />
            <Route path={ROUTES.settings} element={<SettingsLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="preferences" element={<SettingsPreferencesPage />} />
              <Route path="notifications" element={<SettingsNotificationsPage />} />
              <Route path="security" element={<SettingsSecurityPage />} />
              <Route path="danger-zone" element={<SettingsDangerZonePage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      </AuthSessionProvider>
    </BrowserRouter>
  )
}

export { AppRouter }
