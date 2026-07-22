import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/layout/Section"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { FadeIn } from "@/components/motion/FadeIn"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { useAppAuthNavigate } from "@/hooks/useAppAuthNavigate"
import { useAuthSession } from "@/hooks/useAuthSession"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const pricingPlans = [
  {
    name: "Free",
    priceMonthly: 0,
    description: "Sign In Today for 2 lifetime audits to explore Convertly",
    features: [
      "2 lifetime audits",
    ],
    ctaText: "Get Started Free",
    ctaRoute: ROUTES.signup,
    highlighted: false,
  },
  {
    name: "Starter",
    priceMonthly: 29,
    description: "For solo operators running regular conversion checks.",
    features: [
      "10 audits per month",
    ],
    ctaText: "Upgrade to Starter",
    ctaRoute: ROUTES.signup,
    highlighted: true,
  },
  {
    name: "Growth",
    priceMonthly: 100,
    description: "For growth teams scaling audit volume",
    features: [
      "30 audits per month",
    ],
    ctaText: "Upgrade to Growth",
    ctaRoute: ROUTES.signup,
    highlighted: false,
  },
]

function PricingSection() {
  const { navigateWithSession } = useAppAuthNavigate()
  const { isAuthenticated } = useAuthSession()
  const navigate = useNavigate()

  const handlePlanClick = (planCtaRoute: string) => {
    if (isAuthenticated) {
      // Logged in: go straight to billing, bypassing any default dashboard redirect
      navigate(ROUTES.billing)
    } else {
      void navigateWithSession(planCtaRoute)
    }
  }

  return (
    <Section aria-labelledby="pricing-title" containerClassName="marketing-container">
      <div className="marketing-section-stack">
        <FadeIn>
          <SectionHeader
            centered
            eyebrow="Pricing"
            title="Simple, performance-driven plans"
            titleId="pricing-title"
            description="Find a plan matching your site growth strategy."
          />
        </FadeIn>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3 items-stretch mt-4">
          {pricingPlans.map((plan, idx) => {
            const isCustom = typeof plan.priceMonthly === "string"

            return (
              <FadeIn
                key={plan.name}
                delay={0.05 + idx * 0.08}
                className="h-auto min-h-0 md:h-full"
              >
                <Card
                  className={cn(
                    "relative flex flex-col gap-6 p-6 sm:p-8 bg-[color-mix(in_srgb,var(--surface)_74%,transparent)] border-[color-mix(in_srgb,var(--border)_90%,transparent)] transition-all duration-300 hover:translate-y-[-4px] h-full",
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
                      {isCustom ? plan.priceMonthly : `$${plan.priceMonthly}`}
                    </span>
                    {!isCustom && (
                      <Text variant="muted" size="sm" className="max-w-none">
                        /mo
                      </Text>
                    )}
                  </div>

                  <Button
                    onClick={() => handlePlanClick(plan.ctaRoute)}
                    className={cn(
                      "w-full h-11 transition-all duration-300 cursor-pointer",
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
              </FadeIn>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

export { PricingSection }