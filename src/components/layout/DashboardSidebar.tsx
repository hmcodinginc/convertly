import {
  Building2,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  PlusCircle,
  Settings,
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { ConvertlyNavLogoLink } from "@/components/brand/ConvertlyLogo"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const primaryNavItems = [
  {
    label: "Dashboard",
    to: ROUTES.dashboard,
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "New Audit",
    to: ROUTES.auditNew,
    icon: PlusCircle,
    end: false,
  },
  {
    label: "Audit History",
    to: ROUTES.audits,
    icon: History,
    end: false,
  },
] as const

const secondaryNavItems = [
  {
    label: "Workspace",
    to: ROUTES.workspace,
    icon: Building2,
    end: false,
  },
  {
    label: "Billing",
    to: ROUTES.billing,
    icon: CreditCard,
    end: false,
  },
  {
    label: "Settings",
    to: ROUTES.settings,
    icon: Settings,
    end: false,
  },
] as const

function DashboardSidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-[color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] lg:w-[15.5rem]">
      <div className="flex h-14 items-center border-b border-[color-mix(in_srgb,var(--border)_65%,transparent)] px-4 lg:h-[4.5rem] lg:px-5">
        <ConvertlyNavLogoLink to={ROUTES.dashboard} end />
      </div>

      <nav
        className="flex flex-1 flex-col gap-5 p-3 lg:gap-6 lg:p-4"
        aria-label="App navigation"
      >
        <div className="flex flex-col gap-0.5">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
                    : "text-foreground/65 hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground"
                )
              }
            >
              <item.icon
                className="size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="px-3 pb-2 text-xs font-medium tracking-[0.14em] text-muted uppercase">
            Workspace
          </p>
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
                    : "text-foreground/65 hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground"
                )
              }
            >
              <item.icon
                className="size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-[color-mix(in_srgb,var(--border)_65%,transparent)] p-3 lg:p-4">
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
