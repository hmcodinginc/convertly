import { Container } from "@/components/layout/Container"
import { ConvertlyLogoLink } from "@/components/brand/ConvertlyLogo"
import { MarketingNavLink } from "@/components/layout/MarketingNavLink"
import { Text } from "@/components/ui/typography/Text"
import { MARKETING_NAV_ITEMS } from "@/lib/marketingNavigation"
import { ROUTES } from "@/lib/routes"

function FooterSection() {
  const year = new Date().getFullYear()

  return (
    <footer
      aria-label="Footer"
      className="border-t border-[color-mix(in_srgb,var(--border)_78%,transparent)] pt-12 pb-8 sm:pt-16 sm:pb-10"
    >
      <Container className="marketing-container">
        <div className="flex flex-col gap-8">
          <div className="marketing-scroll-target space-y-3" id="footer-brand">
            <ConvertlyLogoLink to={ROUTES.home} className="text-foreground/90" />
            <Text variant="muted" size="sm" className="max-w-[48ch] leading-6 text-foreground/62">
              AI-powered conversion intelligence for modern product and growth teams.
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {MARKETING_NAV_ITEMS.map((link) => (
              <MarketingNavLink
                key={link.label}
                sectionId={link.sectionId}
                className="text-sm text-foreground/62 transition-colors duration-[var(--motion-fast)] hover:text-foreground/90"
              >
                {link.label}
              </MarketingNavLink>
            ))}
          </div>

          <Text size="sm" variant="muted" className="max-w-none text-foreground/50">
            © {year} Convertly. All rights reserved to HM Coding.
          </Text>
        </div>
      </Container>
    </footer>
  )
}

export { FooterSection }
