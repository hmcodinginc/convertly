import { ClipboardList } from "lucide-react"
import { NavLink } from "react-router-dom"

import { ConvertlyNavLogoLink } from "@/components/brand/ConvertlyLogo"
import { DashboardNavContent } from "@/components/layout/DashboardNavContent"
import { ROUTES } from "@/lib/routes"

function DashboardSidebar() {
  return (
    <aside className="hidden h-screen w-[15.5rem] shrink-0 flex-col border-r border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] lg:sticky lg:top-0 lg:flex">
      <div className="flex h-[4.5rem] shrink-0 items-center border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-5">
        <ConvertlyNavLogoLink to={ROUTES.dashboard} end />
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4"
        aria-label="App navigation"
      >
        <DashboardNavContent includeMarketingLink={false} />
      </nav>

      <div className="shrink-0 border-t border-[color-mix(in_srgb,var(--border)_65%,transparent)] p-4">
        <NavLink
          to={ROUTES.home}
          className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-foreground/55 transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground/85"
        >
          <ClipboardList className="size-4 shrink-0 opacity-60" aria-hidden />
          Marketing site
        </NavLink>
      </div>
    </aside>
  )
}

export { DashboardSidebar }
