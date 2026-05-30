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

export const legalContent = {
  terms: {
    title: "Terms & Conditions",
    sections: [
      {
        heading: "1. Acceptance",
        body: "By creating a Convertly account, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, do not use the service.",
      },
      {
        heading: "2. Service description",
        body: "Convertly provides AI-assisted website conversion analysis, audit reporting, and workflow tools for product and growth teams. Features may evolve during the MVP launch period.",
      },
      {
        heading: "3. Acceptable use",
        body: "You may only analyze websites you own or have permission to evaluate. You agree not to misuse the platform, attempt unauthorized access, or interfere with service availability.",
      },
      {
        heading: "4. Accounts",
        body: "You are responsible for safeguarding your credentials and for activity under your account. Notify us promptly of any unauthorized use.",
      },
      {
        heading: "5. Limitation of liability",
        body: "Convertly is provided on an as-is basis during MVP. HM Coding is not liable for indirect or consequential damages arising from use of the platform.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Information we collect",
        body: "We collect account details such as name and email, audit configuration data, and usage information needed to operate and improve Convertly.",
      },
      {
        heading: "2. How we use data",
        body: "Data is used to authenticate users, generate audit reports, improve product quality, and communicate service updates relevant to your account.",
      },
      {
        heading: "3. Data storage",
        body: "During MVP, some data may be stored locally or in configured cloud providers. Production deployments will use Supabase and secure infrastructure practices.",
      },
      {
        heading: "4. Sharing",
        body: "We do not sell personal data. Limited sharing may occur with infrastructure providers strictly to deliver the service.",
      },
      {
        heading: "5. Your choices",
        body: "You may request account deletion or data export by contacting HM Coding. Additional controls will expand as Convertly moves beyond MVP.",
      },
    ],
  },
  about: {
    title: "About Convertly",
    sections: [
      {
        heading: "Mission",
        body: "Convertly helps modern product and growth teams improve website conversion with focused AI analysis, clear prioritization, and actionable recommendations.",
      },
      {
        heading: "Who it is for",
        body: "Convertly is designed for teams that care about conversion quality — from early-stage startups validating funnels to growth teams optimizing mature products.",
      },
      {
        heading: "Built by HM Coding",
        body: "Convertly is developed and owned by HM Coding, a technology firm focused on websites, web apps, and AI-driven product experiences.",
      },
      {
        heading: "Launch status",
        body: "Convertly is in active MVP development. Features, pricing, and integrations will expand based on user feedback during the launch sprint.",
      },
    ],
  },
} as const
