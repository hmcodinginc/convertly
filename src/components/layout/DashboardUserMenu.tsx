import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Settings, User } from "lucide-react"
import * as React from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuthSession } from "@/components/auth/AuthSessionProvider"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

type DashboardUserMenuProps = {
  className?: string
}

function DashboardUserMenu({ className }: DashboardUserMenuProps) {
  const navigate = useNavigate()
  const { account, logout } = useAuthSession()
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate(ROUTES.login, { replace: true })
  }

  const initials = account?.initials ?? "C"
  const fullName = account?.fullName ?? "Account"
  const email = account?.email ?? ""

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-2.5 py-1.5 text-left shadow-[0_8px_24px_-18px_rgba(0,0,0,0.85)] transition-[background-color,border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:border-[color-mix(in_srgb,var(--accent)_24%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
      >
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c6cff_0%,#5d7dff_52%,#35b3ff_100%)] text-xs font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        >
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-foreground/92">
            {fullName}
          </span>
          <span className="block truncate text-xs text-muted">{email}</span>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_60%,transparent)] bg-[color-mix(in_srgb,var(--background)_94%,var(--surface))] p-1.5 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl"
          >
            <div className="border-b border-[color-mix(in_srgb,var(--border)_45%,transparent)] px-3 py-3">
              <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
            </div>

            <div className="py-1">
              <MenuLink
                to={ROUTES.profile}
                icon={User}
                label="Profile"
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                to={ROUTES.settings}
                icon={Settings}
                label="Settings"
                onSelect={() => setOpen(false)}
              />
            </div>

            <div className="border-t border-[color-mix(in_srgb,var(--border)_45%,transparent)] pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[#fca5a5] transition-colors hover:bg-[color-mix(in_srgb,#ef4444_12%,transparent)]"
              >
                <LogOut className="size-4 shrink-0 opacity-80" aria-hidden />
                Logout
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

type MenuLinkProps = {
  to: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  onSelect: () => void
}

function MenuLink({ to, icon: Icon, label, onSelect }: MenuLinkProps) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] hover:text-foreground"
    >
      <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
      {label}
    </Link>
  )
}

export { DashboardUserMenu }
