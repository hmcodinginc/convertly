import * as React from "react"
import { Link } from "react-router-dom"
import { ConvertlyMarketingLogoLink } from "@/components/brand/ConvertlyLogo"
import { Button } from "@/components/ui/button"
import { MarketingNavLink } from "@/components/layout/MarketingNavLink"
import { MARKETING_NAV_ITEMS } from "@/lib/marketingNavigation"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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
          <ConvertlyMarketingLogoLink sectionId="home-hero-title" />

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {MARKETING_NAV_ITEMS.map((item) => (
              <MarketingNavLink
                key={item.label}
                sectionId={item.sectionId}
                className="text-sm text-foreground/70 transition-colors duration-[var(--motion-fast)] hover:text-foreground"
              >
                {item.label}
              </MarketingNavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 px-3.5" asChild>
              <Link to={ROUTES.login}>Login</Link>
            </Button>
            <Button size="sm" className="h-9 px-4" asChild>
              <Link to={ROUTES.signup}>Start Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export { Navbar }
