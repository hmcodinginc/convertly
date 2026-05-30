import { DashboardUserMenu } from "@/components/layout/DashboardUserMenu"

function DashboardTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
      <div className="flex h-14 items-center justify-end px-4 lg:h-[4.5rem] lg:px-6">
        <DashboardUserMenu />
      </div>
    </header>
  )
}

export { DashboardTopBar }
