import { Megaphone, Rocket, Users } from "lucide-react"

import { AuthSlideFrame } from "@/features/auth/components/AuthSlideFrame"
import { Card } from "@/components/surfaces/Card"
import { Heading } from "@/components/ui/typography/Heading"
import { Text } from "@/components/ui/typography/Text"
import { AUTH_SHOWCASE_SLIDES } from "@/features/auth/content/authContent"

const slide = AUTH_SHOWCASE_SLIDES[4]

const teamBenefits = [
  {
    icon: Rocket,
    team: "Product",
    benefit: "Ship UX fixes with confidence scores and clear issue ownership.",
  },
  {
    icon: Megaphone,
    team: "Marketing",
    benefit: "Align landing pages and campaigns to conversion intent signals.",
  },
  {
    icon: Users,
    team: "Growth",
    benefit: "Prioritize experiments by modeled revenue impact, not guesswork.",
  },
] as const

function AuthSlideTeams() {
  return (
    <AuthSlideFrame
      eyebrow={slide.eyebrow}
      title={slide.title}
      description={slide.description}
    >
      <div className="flex h-full flex-col gap-2.5">
        {teamBenefits.map((item) => (
          <Card key={item.team} className="auth-showcase-team flex-1 hover:translate-y-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]">
                <item.icon className="size-4 text-foreground/70" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <Heading level={4} size="subsection" className="text-base">
                  {item.team}
                </Heading>
                <Text variant="muted" size="sm" className="max-w-none text-xs leading-5">
                  {item.benefit}
                </Text>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AuthSlideFrame>
  )
}

export { AuthSlideTeams }
