import { motion } from "framer-motion"
import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"

const steps = [
  {
    label: "Step 01",
    title: "Connect your website",
    description:
      "Share your URL and baseline context so Convertly can evaluate the journey that matters most.",
  },
  {
    label: "Step 02",
    title: "Receive focused analysis",
    description:
      "Convertly maps conversion friction and surfaces the highest-impact opportunities first.",
  },
  {
    label: "Step 03",
    title: "Ship improvements faster",
    description:
      "Turn recommendations into prioritized actions your product and growth teams can execute confidently.",
  },
]

function HowItWorksSection() {
  return (
    <Section aria-labelledby="how-it-works-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <FadeIn>
          <SectionHeader
            eyebrow="Flow"
            title="A clear workflow from analysis to action"
            titleId="how-it-works-title"
            description="Designed to keep your team focused on meaningful conversion outcomes without extra process overhead."
          />
        </FadeIn>

        <div className="relative grid gap-4 md:grid-cols-3">
          {/* Animated drawing connection line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-10 right-[16.66%] left-[16.66%] hidden h-[1.5px] bg-[color-mix(in_srgb,var(--border)_35%,transparent)] md:block overflow-hidden"
          >
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.15 }}
              className="h-full bg-gradient-to-r from-[var(--accent)] via-[#5d7dff] to-[var(--accent)] shadow-[0_0_8px_rgba(124,108,255,0.7)]"
            />
          </div>

          {steps.map((step, index) => (
            <FadeIn key={step.label} delay={0.05 + index * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                <Card className="marketing-card h-full bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] border-[color-mix(in_srgb,var(--border)_90%,transparent)] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] hover:shadow-[0_0_20px_rgba(124,108,255,0.12)]">
                  <div className="space-y-4">
                    <Text
                      size="sm"
                      variant="muted"
                      className="max-w-none tracking-[0.16em] uppercase text-foreground/55"
                    >
                      {step.label}
                    </Text>
                    <Heading level={3} size="subsection">
                      {step.title}
                    </Heading>
                    <Text variant="muted" size="sm" className="max-w-none leading-6">
                      {step.description}
                    </Text>
                  </div>
                </Card>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { HowItWorksSection }
