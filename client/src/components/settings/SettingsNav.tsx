import { NavLink } from "react-router-dom"
import { Bell, Globe, SlidersHorizontal, User } from "lucide-react"

import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

import "./SettingsNav.css"

const navItems = [
  { label: "Profile", to: ROUTES.settingsProfile, icon: User },
  { label: "Preferences", to: ROUTES.settingsPreferences, icon: SlidersHorizontal },
  { label: "Notifications", to: ROUTES.settingsNotifications, icon: Bell },
] as const

function SettingsNav() {
  return (
    <nav aria-label="Settings" className="settings-nav">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn("settings-nav__link", isActive && "settings-nav__link--active")
            }
          >
            <Icon className="settings-nav__icon" aria-hidden />
            {item.label}
          </NavLink>
        )
      })}
      <NavLink
        to={ROUTES.workspace}
        className={({ isActive }) =>
          cn(
            "settings-nav__link",
            "settings-nav__link--workspace",
            isActive && "settings-nav__link--active"
          )
        }
      >
        <Globe className="settings-nav__icon" aria-hidden />
        Workspace
      </NavLink>
    </nav>
  )
}

export { SettingsNav }
