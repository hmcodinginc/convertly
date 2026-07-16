import { Menu } from "lucide-react"
import * as React from "react"
import { Link } from "react-router-dom"

import { ConvertlyMarketingLogoLink } from "@/components/brand/ConvertlyLogo"
import { Drawer } from "@/components/feedback/Drawer"
import { Button } from "@/components/ui/button"
import { MarketingNavLink } from "@/components/layout/MarketingNavLink"
import { MARKETING_NAV_ITEMS } from "@/lib/marketingNavigation"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState<string>("home-hero-title")

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ["home-hero-title", "features-title", "how-it-works-title", "pricing-title"]
      let currentSection = "home-hero-title"
      let minDistance = Infinity

      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top < window.innerHeight * 0.45 && rect.bottom > 100) {
            currentSection = id
            break
          }
          const distance = Math.abs(rect.top - 120)
          if (distance < minDistance) {
            minDistance = distance
            currentSection = id
          }
        }
      }
      setActiveSection(currentSection)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  function closeMobileNav() {
    setMobileNavOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
        <div
          className={cn(
            "marketing-container container-premium h-14 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] transition-[background-color,border-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-standard)] sm:h-[4.5rem]",
            "bg-[color-mix(in_srgb,var(--background)_64%,transparent)] backdrop-blur-sm",
            scrolled &&
              "border-[color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color-mix(in_srgb,var(--background)_84%,transparent)] shadow-[0_10px_30px_rgba(2,6,23,0.28)]"
          )}
        >
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5">
            <ConvertlyMarketingLogoLink sectionId="home-hero-title" />

            <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
              {MARKETING_NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.sectionId
                return (
                  <MarketingNavLink
                    key={item.label}
                    sectionId={item.sectionId}
                    className={cn(
                      "text-sm font-medium transition-all duration-300 relative py-1.5 px-2.5 rounded-[var(--radius-sm)]",
                      isActive
                        ? "text-foreground font-semibold bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-foreground/70 hover:text-foreground hover:bg-[color-mix(in_srgb,var(--surface)_50%,transparent)]"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                    )}
                  </MarketingNavLink>
                )
              })}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" className="h-9 px-3.5" asChild>
                <Link to={ROUTES.login}>Login</Link>
              </Button>
              <Button size="sm" className="h-9 px-4" asChild>
                <Link to={ROUTES.signup}>Start Free</Link>
              </Button>
            </div>

            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] text-foreground/80 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_24%,var(--border))] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <Drawer
        open={mobileNavOpen}
        onClose={closeMobileNav}
        title="Menu"
        side="right"
        className="max-w-[20rem] md:hidden"
      >
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {MARKETING_NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.sectionId
            return (
              <MarketingNavLink
                key={item.label}
                sectionId={item.sectionId}
                onClick={closeMobileNav}
                className={cn(
                  "flex min-h-11 items-center rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-foreground font-semibold"
                    : "text-foreground/75 hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] hover:text-foreground"
                )}
              >
                {item.label}
              </MarketingNavLink>
            )
          })}
        </nav>

        <div className="mt-6 flex flex-col gap-2 border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)] pt-6">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={ROUTES.login} onClick={closeMobileNav}>
              Login
            </Link>
          </Button>
          <Button size="sm" className="marketing-cta-primary w-full" asChild>
            <Link to={ROUTES.signup} onClick={closeMobileNav}>
              Start Free
            </Link>
          </Button>
        </div>
      </Drawer>
    </>
  )
}

export { Navbar }
