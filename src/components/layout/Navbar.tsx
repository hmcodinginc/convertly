import * as React from "react"
import { Button } from "@/components/ui/button"
import { useAppAuthNavigate } from "@/hooks/useAppAuthNavigate"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Features", href: "#features-title" },
  { label: "How it Works", href: "#how-it-works-title" },
  { label: "Pricing", href: "#cta-title" },
  { label: "Docs", href: "#footer-brand" },
]

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const { navigateWithSession } = useAppAuthNavigate()

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleLogin = () => {
    void navigateWithSession(ROUTES.dashboard)
  }

  const handleStartFree = () => {
    void navigateWithSession(ROUTES.auditNew)
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
      <div
        className={cn(
          "marketing-container container-premium h-[4.5rem] rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] transition-[background-color,border-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-standard)]",
          "bg-[color-mix(in_srgb,var(--background)_64%,transparent)] backdrop-blur-sm",
          scrolled &&
            "border-[color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color-mix(in_srgb,var(--background)_84%,transparent)] shadow-[0_10px_30px_rgba(2,6,23,0.28)]"
        )}
      >
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5">
          <a
            href="#home-hero-title"
            className="text-sm font-medium tracking-[0.12em] text-foreground/95 uppercase"
          >
            Convertly
          </a>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-foreground/70 transition-colors duration-[var(--motion-fast)] hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3.5"
              type="button"
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button size="sm" className="h-9 px-4" type="button" onClick={handleStartFree}>
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export { Navbar }
