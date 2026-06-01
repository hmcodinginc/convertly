import { ClipboardList, LogOut, User } from "lucide-react"
import { Link, NavLink, useNavigate } from "react-router-dom"

import { useAuthSession } from "@/components/auth/AuthSessionProvider"
import {
  primaryNavItems,
  secondaryNavItems,
} from "@/components/layout/dashboardNav"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

type DashboardNavContentProps = {
  onNavigate?: () => void
  showMobileAccount?: boolean
  includeMarketingLink?: boolean
}

function navLinkClass(isActive: boolean) {
  return cn(
    "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
    isActive
      ? "bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
      : "text-foreground/65 hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground"
  )
}

function DashboardNavContent({
  onNavigate,
  showMobileAccount = false,
  includeMarketingLink = true,
}: DashboardNavContentProps) {
  const navigate = useNavigate()
  const { logout } = useAuthSession()

  async function handleLogout() {
    onNavigate?.()
    await logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
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
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <item.icon
              className="size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
              aria-hidden
            />
            {item.label}
          </NavLink>
        ))}
      </div>

      {includeMarketingLink ? (
        <div className="border-t border-[color-mix(in_srgb,var(--border)_65%,transparent)] pt-3">
          <NavLink
            to={ROUTES.home}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-foreground/55 transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground/85"
          >
            <ClipboardList className="size-4 shrink-0 opacity-60" aria-hidden />
            Marketing site
          </NavLink>
        </div>
      ) : null}

      {showMobileAccount ? (
        <div className="border-t border-[color-mix(in_srgb,var(--border)_65%,transparent)] pt-3">
          <Link
            to={ROUTES.profile}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-foreground/65 transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground"
          >
            <User className="size-4 shrink-0 opacity-70" aria-hidden />
            Profile
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[#fca5a5] transition-colors hover:bg-[color-mix(in_srgb,#ef4444_12%,transparent)]"
          >
            <LogOut className="size-4 shrink-0 opacity-80" aria-hidden />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}

export { DashboardNavContent }
