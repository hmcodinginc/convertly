import { Outlet } from "react-router-dom"

import { DashboardSidebar } from "@/components/layout/DashboardSidebar"

function DashboardLayout() {
  return (
    <div className="app-atmosphere flex min-h-screen">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { DashboardLayout }
