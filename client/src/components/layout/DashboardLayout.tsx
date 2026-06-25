import { Outlet } from "react-router-dom"

import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { DashboardTopBar } from "@/components/layout/DashboardTopBar"

function DashboardLayout() {
  return (
    <div className="app-atmosphere flex min-h-dvh flex-col lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
        <DashboardTopBar />
        <main className="flex-1 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain lg:[-webkit-overflow-scrolling:touch]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { DashboardLayout }
