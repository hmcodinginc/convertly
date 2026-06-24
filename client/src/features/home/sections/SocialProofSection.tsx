import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"

const trustIndicators = [
  "AI-first growth workflows",
  "Focused conversion analysis",
  "Built for modern product teams",
]

const logoPlaceholders = [
  "Vectra",
  "Halcyon",
  "Baseline",
  "Meridian",
  "Orbitly",
  "Slate",
]

function SocialProofSection() {
  return (
    <Section aria-labelledby="social-proof-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <FadeIn>
          <SectionHeader
            eyebrow="Trust"
            title="Built for teams that care about conversion quality"
            titleId="social-proof-title"
            description="Convertly supports product, marketing, and growth teams with focused insights they can act on quickly."
          />
        </FadeIn>

        <FadeIn delay={0.06}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {trustIndicators.map((item) => (
              <Text
                key={item}
                size="sm"
                variant="muted"
                className="max-w-none text-center tracking-wide"
              >
                {item}
              </Text>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="marketing-card-compact bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] hover:translate-y-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {logoPlaceholders.map((logo) => (
                <div
                  key={logo}
                  className="marketing-tile flex min-h-14 items-center justify-center border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] text-center"
                >
                  <Text
                    size="sm"
                    variant="muted"
                    className="max-w-none tracking-[0.12em] uppercase"
                  >
                    {logo}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>
    </Section>
  )
}

export { SocialProofSection }
