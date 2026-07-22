import { motion } from "framer-motion"
import { Section } from "@/components/layout/Section"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { cn } from "@/lib/utils"

const trustCards = [
  {
    title: "Insight-first growth workflows",
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
  return (
    <Section aria-labelledby="social-proof-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <div 
          className="w-full flex flex-col items-center justify-center text-center mx-auto max-w-2xl gap-3"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", marginLeft: "auto", marginRight: "auto" }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-xs font-semibold tracking-widest text-[var(--accent)] uppercase text-center"
            style={{ textAlign: "center" }}
          >
            TRUST
          </motion.span>

          <motion.h2
            id="social-proof-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-3xl md:text-4xl font-bold text-foreground leading-tight text-center w-full"
            style={{ textAlign: "center", width: "100%" }}
          >
            Focused on clear analysis and launch-grade reliability
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-muted-foreground text-base leading-7 text-center max-w-xl mx-auto"
            style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto", maxWidth: "36rem" }}
          >
            Convertly is positioned around practical audit output, transparent limitations, and scoped product workflows.
          </motion.p>
        </div>

        {/* 3-Column Trust Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3 mt-4">
          {trustCards.map((item, idx) => (
            <FadeIn key={item.title} delay={0.05 + idx * 0.05}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="marketing-card p-6 bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] border-[color-mix(in_srgb,var(--border)_85%,transparent)] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] hover:shadow-[0_0_20px_rgba(124,108,255,0.08)] flex flex-col items-center gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + idx * 0.05, type: "spring", stiffness: 260, damping: 18 }}
                    className="flex size-10 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_15%,transparent)] shrink-0"
                  >
                    {item.icon}
                  </motion.div>
                  <div className="space-y-1.5 flex flex-col items-center">
                    <h3 className="text-base font-bold text-foreground leading-tight">{item.title}</h3>
                    <Text variant="muted" size="sm" className="leading-6 max-w-none text-center">
                      {item.description}
                    </Text>
                  </div>
                </Card>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.1}>
          <Card className="marketing-card-compact bg-[color-mix(in_srgb,var(--surface)_58%,transparent)] border-[color-mix(in_srgb,var(--border)_85%,transparent)] hover:translate-y-0 mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                "Public-page website audits with deterministic scoring",
                "Supabase-backed auth, billing, and data access controls",
                "AI assistant scoped to Convertly product context",
              ].map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4, ease: "easeOut" }}
                  className="marketing-tile flex min-h-14 items-center justify-center border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 text-center"
                >
                  <Text size="sm" variant="muted" className="max-w-none leading-6 text-center">
                    {item}
                  </Text>
                </motion.div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>
    </Section>
  )
}

export { SocialProofSection }