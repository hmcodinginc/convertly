import { useState } from "react"
import { Check } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { useAppAuthNavigate } from "@/hooks/useAppAuthNavigate"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const pricingPlans = [
  {
    name: "Starter",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Essential audit features for side projects and indie hackers.",
    features: [
      "1 website crawl / month",
      "Standard HTML analysis",
      "Basic scoring engine checks",
      "Online report preview",
    ],
    ctaText: "Get Started Free",
    ctaRoute: ROUTES.signup,
    highlighted: false,
  },
  {
    name: "Growth Pro",
    priceMonthly: 49,
    priceYearly: 39,
    description: "Advanced conversion intelligence for high-converting teams.",
    features: [
      "5 website crawls / month",
      "V4 Engine (intent & cluster scoring)",
      "High-fidelity JS rendering bot",
      "Priority Opportunity Queue",
      "Actionable recommendations",
      "Unlimited PDF report exports",
    ],
    ctaText: "Upgrade to Pro",
    ctaRoute: ROUTES.signup,
    highlighted: true,
  },
  {
    name: "Enterprise",
    priceMonthly: "Custom",
    priceYearly: "Custom",
    description: "Bespoke crawl limit & custom rule packs for agencies and large organizations.",
    features: [
      "Unlimited audits & crawls",
      "Custom brand rule packs",
      "Dedicated render proxy IPs",
      "Multi-user team workspaces",
      "Custom SLA & account support",
      "Dedicated account manager",
    ],
    ctaText: "Contact Sales",
    ctaRoute: ROUTES.signup,
    highlighted: false,
  },
]

function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")
  const { navigateWithSession } = useAppAuthNavigate()

  return (
    <Section aria-labelledby="pricing-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple, performance-driven plans"
          titleId="pricing-title"
          description="Find a plan matching your site growth strategy. Save 20% when you pay yearly."
        />

        {/* Toggle Switch */}
        <div className="flex justify-center mt-2">
          <div className="relative flex rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-1">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "relative z-10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 rounded-full",
                billingPeriod === "monthly" ? "text-foreground" : "text-foreground/60 hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={cn(
                "relative z-10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 rounded-full",
                billingPeriod === "yearly" ? "text-foreground" : "text-foreground/60 hover:text-foreground"
              )}
            >
              Yearly
            </button>
            <motion.div
              layoutId="pricing-billing-bg"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="absolute inset-y-1 rounded-full bg-[var(--accent)] shadow-[0_0_12px_rgba(124,108,255,0.4)]"
              style={{
                width: "50%",
                left: billingPeriod === "monthly" ? "4px" : "calc(50% - 4px)",
              }}
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3 items-stretch mt-4">
          {pricingPlans.map((plan) => {
            const isCustom = typeof plan.priceMonthly === "string"
            const currentPrice = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly
            
            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col gap-6 p-6 sm:p-8 bg-[color-mix(in_srgb,var(--surface)_74%,transparent)] border-[color-mix(in_srgb,var(--border)_90%,transparent)] transition-all duration-300 hover:translate-y-[-4px]",
                  plan.highlighted && "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] shadow-[0_0_24px_rgba(124,108,255,0.14)]"
                )}
              >
                {plan.highlighted && (
                  <span className="absolute top-0 right-6 translate-y-[-50%] inline-flex items-center rounded-full bg-[var(--accent)] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-wider text-[var(--accent-foreground)] shadow-[0_0_10px_rgba(124,108,255,0.6)]">
                    Most Popular
                  </span>
                )}

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{plan.name}</h3>
                  <Text variant="muted" size="sm" className="leading-5 max-w-none">
                    {plan.description}
                  </Text>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">
                    {isCustom ? currentPrice : `$${currentPrice}`}
                  </span>
                  {!isCustom && (
                    <Text variant="muted" size="sm" className="max-w-none">
                      /mo
                    </Text>
                  )}
                </div>

                <Button
                  onClick={() => void navigateWithSession(plan.ctaRoute)}
                  className={cn(
                    "w-full h-11 transition-all duration-300",
                    plan.highlighted
                      ? "marketing-cta-primary bg-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_80%,white)] text-[var(--accent-foreground)] shadow-[0_0_14px_rgba(124,108,255,0.3)]"
                      : "marketing-cta-secondary border-[var(--border)] bg-transparent hover:bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] text-foreground"
                  )}
                >
                  {plan.ctaText}
                </Button>

                {/* Divider */}
                <div className="h-px bg-[color-mix(in_srgb,var(--border)_50%,transparent)]" />

                {/* Features List */}
                <ul className="space-y-3 flex-1 flex flex-col justify-start">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] mt-0.5">
                        <Check className="size-2.5" />
                      </span>
                      <span className="text-foreground/75 leading-none">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export { PricingSection }
