export type AuthLegalView = "terms" | "privacy" | "about"

export const AUTH_SLIDE_INTERVAL_MS = 5500

export const AUTH_SHOWCASE_SLIDES = [
  {
    id: "overview",
    eyebrow: "Dashboard",
    title: "Conversion intelligence for growth teams",
    description:
      "Monitor funnel health, prioritize fixes, and track audit outcomes from one focused workspace.",
  },
  {
    id: "audit-report",
    eyebrow: "Sample audit",
    title: "See revenue impact at a glance",
    description:
      "Every audit surfaces scores, modeled uplift, and open opportunities your team can ship this week.",
  },
  {
    id: "recommendations",
    eyebrow: "AI recommendations",
    title: "Actionable fixes, not generic advice",
    description:
      "Convertly turns findings into prioritized experiments with estimated lift and clear implementation direction.",
  },
  {
    id: "workflow",
    eyebrow: "Product workflow",
    title: "From website to shipped improvements",
    description:
      "A clear path from analysis to prioritized actions — without adding process overhead.",
  },
  {
    id: "teams",
    eyebrow: "Built for teams",
    title: "Aligned across Product, Marketing & Growth",
    description:
      "Everyone works from the same conversion signals, priorities, and rollout visibility.",
  },
] as const

export type AuthShowcaseSlideId = (typeof AUTH_SHOWCASE_SLIDES)[number]["id"]

/** Panel titles only — body content lives in documentation components */
export const legalContent = {
  terms: { title: "Terms & Conditions" },
  privacy: { title: "Privacy Policy" },
  about: { title: "About Convertly" },
} as const
