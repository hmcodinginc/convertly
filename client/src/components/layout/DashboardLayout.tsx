import { Outlet } from "react-router-dom"

import { PaymentSessionBoundary } from "@/components/billing/PaymentSessionBoundary"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { DashboardTopBar } from "@/components/layout/DashboardTopBar"
import { BirthdayCelebration } from "@/features/profile/components/BirthdayCelebration"
import { VertlyRoot } from "@/features/vertly/components/VertlyRoot"
import { useAuthSession } from "@/hooks/useAuthSession"

function DashboardLayout() {
  const { session } = useAuthSession()
  const userId = session?.userId

  return (
    <VertlyRoot userId={userId}>
      <div className="app-atmosphere flex min-h-dvh flex-col overflow-x-clip lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden">
        <PaymentSessionBoundary />
        <BirthdayCelebration />
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-x-clip lg:min-h-0">
          <DashboardTopBar />
          <main className="flex-1 min-w-0 overflow-x-clip lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain lg:[-webkit-overflow-scrolling:touch]">
            <Outlet />
          </main>
        </div>
      </div>
    </VertlyRoot>
  )
}

export { DashboardLayout }
