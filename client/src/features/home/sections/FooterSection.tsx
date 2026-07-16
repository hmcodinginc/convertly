import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Container } from "@/components/layout/Container"
import { ConvertlyLogoLink } from "@/components/brand/ConvertlyLogo"
import { MarketingNavLink } from "@/components/layout/MarketingNavLink"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"
interface FooterLink {
  label: string
  sectionId?: string
  href?: string
  to?: string
}
interface FooterColumn {
  title: string
  links: FooterLink[]
}
function FooterSection() {
  const year = new Date().getFullYear()
  const columns: FooterColumn[] = [
    {
      title: "Product",
      links: [
        { label: "Features", sectionId: "features-title" },
        { label: "How it Works", sectionId: "how-it-works-title" },
        { label: "Pricing", sectionId: "pricing-title" },      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", to: ROUTES.about },
        { label: "Security", to: ROUTES.security },
        { label: "Contact", href: "mailto:hello@convertly.com" },
      ]
    }
  ]
  return (
    <footer
      aria-label="Footer"
      className="border-t border-[color-mix(in_srgb,var(--border)_78%,transparent)] pt-16 pb-12 sm:pt-20 sm:pb-14 bg-[color-mix(in_srgb,var(--background-elevated)_30%,transparent)]"
    >
      <Container className="marketing-container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-16"
        >
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-8 lg:gap-12">
            {/* Brand Block */}
            <div className="space-y-4 md:col-span-6 lg:col-span-5">
              <ConvertlyLogoLink to={ROUTES.home} className="text-foreground/90 transition-transform duration-300 hover:scale-[1.02] active:scale-95 inline-flex" />
              <Text variant="muted" size="sm" className="max-w-[42ch] leading-6 text-foreground/60">
                AI growth intelligence for teams that care about conversion quality – from insight to shipped experiment.
              </Text>
            </div>
            {/* Nav Columns — rendered using grid layout for balanced distribution */}
            {columns.map((col, index) => (
              <div
                key={col.title}
                className={`min-w-[120px] pb-6 md:pb-0 md:col-span-3 lg:col-span-3 ${
                  index === 0 ? "lg:col-start-7" : ""
                }`}
              >
                <h4 className="text-sm font-semibold text-white tracking-wide mb-5">{col.title}</h4>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.sectionId ? (
                        <MarketingNavLink
                          sectionId={link.sectionId}
                          className="text-sm text-foreground/60 transition-all duration-[var(--motion-base)] hover:text-white relative py-1 group inline-flex items-center"
                        >
                          {link.label}
                          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[var(--accent)] transition-all duration-300 group-hover:w-full shadow-[0_0_6px_var(--accent)]" />
                        </MarketingNavLink>
                      ) : link.href ? (
                        <a
                          href={link.href}
                          className="text-sm text-foreground/60 transition-all duration-[var(--motion-base)] hover:text-white relative py-1 group inline-flex items-center"
                        >
                          {link.label}
                          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[var(--accent)] transition-all duration-300 group-hover:w-full shadow-[0_0_6px_var(--accent)]" />
                        </a>
                      ) : link.to ? (
                        <Link
                          to={link.to}
                          className="text-sm text-foreground/60 transition-all duration-[var(--motion-base)] hover:text-white relative py-1 group inline-flex items-center"
                        >
                          {link.label}
                          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[var(--accent)] transition-all duration-300 group-hover:w-full shadow-[0_0_6px_var(--accent)]" />
                        </Link>
                      ) : (
                        <a
                          href="#"
                          className="text-sm text-foreground/60 transition-all duration-[var(--motion-base)] hover:text-white relative py-1 group inline-flex items-center"
                        >
                          {link.label}
                          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[var(--accent)] transition-all duration-300 group-hover:w-full shadow-[0_0_6px_var(--accent)]" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Bottom copyright block */}
          <div className="border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Text size="sm" variant="muted" className="max-w-none text-foreground/50 text-center sm:text-left">
              © {year} Convertly. All rights reserved to HM Coding.
            </Text>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">
              <Link
                to={ROUTES.legalPrivacy}
                className="text-xs text-foreground/40 transition-colors hover:text-foreground/70"
              >
                Privacy Policy
              </Link>
              <Link
                to={ROUTES.legalTerms}
                className="text-xs text-foreground/40 transition-colors hover:text-foreground/70"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </footer>
  )
}
export { FooterSection }