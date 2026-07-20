import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Section } from "@/components/layout/Section"
import { FadeIn } from "@/components/motion/FadeIn"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { useAppAuthNavigate } from "@/hooks/useAppAuthNavigate"
import { ROUTES } from "@/lib/routes"

function CtaSection() {
  const { navigateWithSession } = useAppAuthNavigate()

  return (
    <Section aria-labelledby="cta-title" containerClassName="marketing-container">
      <div className="marketing-cta-section relative w-full overflow-hidden rounded-[28px] bg-[#050810]">
        {/* Decorative background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.45)_0%,rgba(99,102,241,0.12)_40%,transparent_70%)] blur-2xl"
        />

        <div className="marketing-cta-section__panel relative z-10 flex flex-col items-center justify-center w-full text-center">
          <div className="marketing-cta-section__content flex flex-col items-center justify-center text-center w-full max-w-[640px] mx-auto gap-6">
            <div className="marketing-cta-section__copy flex flex-col items-center text-center gap-4 w-full">
              <FadeIn>
                <Heading
                  id="cta-title"
                  level={2}
                  className="text-balance text-center text-4xl font-extrabold leading-[1.15] text-white sm:text-[2.75rem]"
                >
                  Ready to unlock your next conversion breakthrough?
                </Heading>
              </FadeIn>

              <FadeIn delay={0.1}>
                <Text className="mx-auto max-w-[42ch] text-center text-base text-white/50 sm:text-lg">
                  Run a focused Convertly audit and get clear opportunities your team can ship
                  this week.
                </Text>
              </FadeIn>
            </div>

            <FadeIn delay={0.2}>
              <div className="marketing-cta-section__actions flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void navigateWithSession(ROUTES.auditNew)}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:from-indigo-400 hover:to-violet-400 hover:-translate-y-px active:translate-y-0 transition-all duration-[var(--motion-base)] ease-[var(--ease-standard)] cursor-pointer"
                >
                  Start free audit
                  <ArrowUpRight className="size-4" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 px-6 py-5 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/25 hover:-translate-y-px active:translate-y-0 transition-all duration-[var(--motion-base)] ease-[var(--ease-standard)] cursor-pointer"
                >
                  <Link to={ROUTES.sampleReport}>View sample report</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </Section>
  )
}

export { CtaSection }