import { Outlet } from "react-router-dom"

import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { DashboardTopBar } from "@/components/layout/DashboardTopBar"

function DashboardLayout() {
  return (
    <div className="app-atmosphere flex h-screen min-h-screen flex-col overflow-hidden lg:flex-row">
      <DashboardSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardTopBar />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { DashboardLayout }
