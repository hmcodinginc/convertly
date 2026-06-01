import { Menu } from "lucide-react"
import { useState } from "react"

import { ConvertlyNavLogoLink } from "@/components/brand/ConvertlyLogo"
import { Drawer } from "@/components/feedback/Drawer"
import { DashboardNavContent } from "@/components/layout/DashboardNavContent"
import { DashboardUserMenu } from "@/components/layout/DashboardUserMenu"
import { ROUTES } from "@/lib/routes"

function DashboardTopBar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 shrink-0 border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:h-[4.5rem] lg:justify-end lg:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] text-foreground/80 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_24%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="size-4" aria-hidden />
            </button>
            <ConvertlyNavLogoLink to={ROUTES.dashboard} end className="min-w-0" />
          </div>
          <DashboardUserMenu />
        </div>
      </header>

      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigation"
        side="left"
        className="max-w-[18rem]"
      >
        <DashboardNavContent
          showMobileAccount
          onNavigate={() => setMobileNavOpen(false)}
        />
      </Drawer>
    </>
  )
}

export { DashboardTopBar }
