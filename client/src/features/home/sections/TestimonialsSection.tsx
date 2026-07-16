import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { motion } from "framer-motion"

const launchPrinciples = [
  {
    quote: "Deterministic audit rules and explicit findings are prioritized over generic AI copy so teams can review why an issue was flagged.",
    name: "Deterministic audits",
    role: "Audit methodology",
    avatar: "DA",
  },
  {
    quote: "Public-page analysis, structured scoring, and consultant-style recommendations are designed to help product and growth teams act quickly.",
    name: "Actionable reporting",
    role: "Product workflow",
    avatar: "AR",
  },
  {
    quote: "Convertly is in launch hardening. We would rather show accurate product capabilities than publish placeholder customer claims.",
    name: "Launch transparency",
    role: "Operating principle",
    avatar: "LT",
  },
]

function TestimonialsSection() {
  return (
    <Section aria-labelledby="testimonials-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <SectionHeader
          eyebrow="Approach"
          title="Built around correctness and usable output"
          titleId="testimonials-title"
          description="These are the product principles guiding Convertly at launch."
        />

        <div className="grid gap-6 md:grid-cols-3 mt-4">
          {launchPrinciples.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="h-full"
            >
              <Card className="flex flex-col gap-4 p-6 bg-[color-mix(in_srgb,var(--surface)_74%,transparent)] border-[color-mix(in_srgb,var(--border)_90%,transparent)] h-full justify-between transition-all duration-300 hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] hover:shadow-[0_0_20px_rgba(124,108,255,0.1)]">
                <Text size="sm" className="italic leading-6 text-foreground/80 max-w-none">
                  “{t.quote}”
                </Text>

                <div className="flex items-center gap-3 mt-4 border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] pt-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent)_0%,#5d7dff_100%)] text-xs font-bold text-white shadow-[0_0_8px_rgba(124,108,255,0.4)]">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground/90 leading-none">{t.name}</h4>
                    <span className="text-xs text-foreground/50 leading-none mt-1.5 block">{t.role}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

export { TestimonialsSection }
