import { NavLink } from "react-router-dom"
import {
  Bell,
  Globe,
  Shield,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react"

import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const navItems: Array<{
  label: string
  to: string
  icon: typeof User
  external?: boolean
}> = [
  { label: "Profile", to: ROUTES.profile, icon: User, external: true },
  { label: "Preferences", to: ROUTES.settingsPreferences, icon: SlidersHorizontal },
  { label: "Notifications", to: ROUTES.settingsNotifications, icon: Bell },
  { label: "Security", to: ROUTES.settingsSecurity, icon: Shield },
  { label: "Danger zone", to: ROUTES.settingsDangerZone, icon: Trash2 },
]

function SettingsNav() {
  return (
    <nav aria-label="Settings" className="settings-nav">
      {navItems.map((item) => {
        const Icon = item.icon
        const className = ({ isActive }: { isActive: boolean }) =>
          cn(
            "settings-nav__link",
            isActive && !item.external && "settings-nav__link--active"
          )

        if (item.external) {
          return (
            <NavLink key={item.to} to={item.to} className="settings-nav__link">
              <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
              {item.label}
            </NavLink>
          )
        }

        return (
          <NavLink key={item.to} to={item.to} className={className}>
            <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
            {item.label}
          </NavLink>
        )
      })}
      <NavLink to={ROUTES.workspace} className="settings-nav__link mt-2 border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] pt-3">
        <Globe className="size-4 shrink-0 opacity-70" aria-hidden />
        Workspace
      </NavLink>
    </nav>
  )
}

export { SettingsNav }
