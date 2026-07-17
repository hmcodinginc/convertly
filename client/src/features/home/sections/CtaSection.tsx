import { Link } from "react-router-dom"

import { Section } from "@/components/layout/Section"
import { FadeIn } from "@/components/motion/FadeIn"
import { GlassPanel } from "@/components/surfaces/GlassPanel"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { useAppAuthNavigate } from "@/hooks/useAppAuthNavigate"
import { ROUTES } from "@/lib/routes"

function CtaSection() {
  const { navigateWithSession } = useAppAuthNavigate()

  return (
    <Section aria-labelledby="cta-title" containerClassName="marketing-container">
      <FadeIn>
        <div className="marketing-cta-section relative w-full overflow-hidden rounded-[var(--radius-xl)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[var(--gradient-primary)] opacity-14"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--background)_72%,transparent)]"
          />

          <GlassPanel className="marketing-cta-section__panel relative border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-transparent">
            <div className="marketing-cta-section__content">
              <div className="marketing-cta-section__copy">
                <Heading
                  id="cta-title"
                  level={2}
                  size="title"
                  className="marketing-scroll-target text-balance"
                >
                  Ready to unlock your next conversion breakthrough?
                </Heading>

                <Text variant="muted" size="lg" balanced className="mx-auto max-w-[42ch]">
                  Run a focused Convertly audit and get clear opportunities your team can ship
                  this week.
                </Text>
              </div>

              <div className="marketing-cta-section__actions">
                <Button
                  type="button"
                  className="marketing-cta-primary w-full sm:w-auto"
                  onClick={() => void navigateWithSession(ROUTES.auditNew)}
                >
                  Start Free Audit
                </Button>
                <Button
                  variant="outline"
                  className="marketing-cta-secondary w-full sm:w-auto"
                  asChild
                >
                  <Link to={ROUTES.sampleReport}>View Sample Report</Link>
                </Button>
              </div>
            </div>
          </GlassPanel>
        </div>
      </FadeIn>
    </Section>
  )
}

export { CtaSection }
