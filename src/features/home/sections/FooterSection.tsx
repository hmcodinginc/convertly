import { Container } from "@/components/layout/Container"
import { Text } from "@/components/ui/typography/Text"

const footerLinks = [
  { label: "Features", href: "#features-title" },
  { label: "How it Works", href: "#how-it-works-title" },
  { label: "Pricing", href: "#cta-title" },
  { label: "Docs", href: "#home-hero-title" },
]

function FooterSection() {
  const year = new Date().getFullYear()

  return (
    <footer
      aria-label="Footer"
      className="border-t border-[color-mix(in_srgb,var(--border)_78%,transparent)] pt-12 pb-8 sm:pt-16 sm:pb-10"
    >
      <Container className="marketing-container">
        <div className="flex flex-col gap-8">
          <div className="space-y-3" id="footer-brand">
            <Text
              size="sm"
              className="max-w-none font-medium tracking-[0.12em] uppercase text-foreground/90"
            >
              Convertly
            </Text>
            <Text variant="muted" size="sm" className="max-w-[48ch] leading-6 text-foreground/62">
              AI-powered conversion intelligence for modern product and growth teams.
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-foreground/62 transition-colors duration-[var(--motion-fast)] hover:text-foreground/90"
              >
                {link.label}
              </a>
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
