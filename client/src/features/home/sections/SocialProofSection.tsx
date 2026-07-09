import { motion } from "framer-motion"
import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

const logoPlaceholders = [
  "Vectra",
  "Halcyon",
  "Baseline",
  "Meridian",
  "Orbitly",
  "Slate",
]

const trustCards = [
  {
    title: "AI-first growth workflows",
    description: "Turn raw analytics into precise, ranked opportunities without adding process weight.",
    icon: (
      <svg className="size-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      </svg>
    )
  },
  {
    title: "Focused conversion analysis",
    description: "Zero in on the friction that costs the most revenue across every journey that matters.",
    icon: (
      <svg className="size-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  },
  {
    title: "Built for modern product teams",
    description: "Product, marketing, and growth share one source of truth — from insight to shipped test.",
    icon: (
      <svg className="size-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    )
  }
]

function SocialProofSection() {
  const repeatedLogos = [...logoPlaceholders, ...logoPlaceholders, ...logoPlaceholders]

  return (
    <Section aria-labelledby="social-proof-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <FadeIn>
          <SectionHeader
            eyebrow="TRUST"
            title="Built for teams that care about conversion quality"
            titleId="social-proof-title"
            description="Convertly supports product, marketing, and growth teams with focused insights they can act on quickly."
          />
        </FadeIn>

        {/* 3-Column Trust Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3 mt-4">
          {trustCards.map((item, idx) => (
            <FadeIn key={item.title} delay={0.05 + idx * 0.05}>
              <Card className="marketing-card p-6 bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] border-[color-mix(in_srgb,var(--border)_85%,transparent)] transition-all duration-300 hover:translate-y-[-4px] hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] hover:shadow-[0_0_20px_rgba(124,108,255,0.08)] flex flex-col gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_15%,transparent)] shrink-0">
                  {item.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground leading-tight">{item.title}</h3>
                  <Text variant="muted" size="sm" className="leading-6 max-w-none">
                    {item.description}
                  </Text>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Logo Wall Marquee */}
        <FadeIn delay={0.1}>
          <Card className="marketing-card-compact bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] border-[color-mix(in_srgb,var(--border)_85%,transparent)] hover:translate-y-0 overflow-hidden relative mt-4">
            {/* Ambient edge-fade masks */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#11141b] to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#11141b] to-transparent z-10"
            />

            <div className="overflow-hidden w-full flex">
              <motion.div
                animate={{ x: ["0%", "-33.333%"] }}
                transition={{
                  repeat: Infinity,
                  ease: "linear",
                  duration: 25,
                }}
                className="flex gap-4 shrink-0 min-w-full"
              >
                {repeatedLogos.map((logo, index) => (
                  <div
                    key={`${logo}-${index}`}
                    className="marketing-tile flex min-h-14 w-[160px] shrink-0 items-center justify-center border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] text-center transition-all duration-300 hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface)_95%,transparent)]"
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
              </motion.div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </Section>
  )
}

export { SocialProofSection }
