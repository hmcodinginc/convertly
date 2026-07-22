import {
  Bot,
  Code2,
  Image,
  Layers,
  Mail,
  MessageSquare,
  Rocket,
  Sparkles,
  Target,
  Telescope,
  Users,
  Zap,
} from "lucide-react"

import { ConvertlyMark } from "@/components/brand/ConvertlyMark"
import { Callout } from "@/features/auth/components/documentation/Callout"
import { DocumentationCard } from "@/features/auth/components/documentation/DocumentationCard"
import { DocumentationSection } from "@/features/auth/components/documentation/DocumentationSection"
import { FeatureList } from "@/features/auth/components/documentation/FeatureList"
import { InfoGrid } from "@/features/auth/components/documentation/InfoGrid"
import { Timeline } from "@/features/auth/components/documentation/Timeline"
import { LEGAL_CONTACT_EMAIL } from "@/features/auth/content/legalConstants"

const ROADMAP = [
  {
    id: "current",
    phase: "Current",
    title: "Conversion intelligence MVP",
    description:
      "Intent-aware conversion audits, Growth Score (Intelligence v4), SPA-aware reliability, Open Graph Page Previews, playbooks, Vertly product guidance, workspace ledger, Razorpay billing, and email notifications.",
  },
  {
    id: "next",
    phase: "Next",
    title: "Team & reliability",
    description:
      "Shared org workspaces, server-side audit job runner, real screenshot capture (separate from Page Preview), stronger crawl for blocked sites, and Razorpay live-mode cutover after QA.",
  },
  {
    id: "future",
    phase: "Future",
    title: "Continuous optimization",
    description:
      "Scheduled audits, score-drop workflows at scale, competitive benchmark audits, optional LLM-assisted Vertly answers, and enterprise packaging.",
  },
] as const

function AboutDocumentation() {
  return (
    <article className="auth-doc">
      <header className="auth-doc-hero">
        <div className="flex items-center gap-2">
          <ConvertlyMark size={22} aria-hidden />
          <p className="auth-doc-hero__eyebrow">About Convertly</p>
        </div>
        <h3 className="auth-doc-hero__title">Conversion intelligence for teams that ship</h3>
        <p className="auth-doc-hero__body">
          Convertly audits public websites for conversion readiness — trust, UX, CTAs, forms, and
          growth blockers — then returns a Growth Score with prioritized, consultant-grade
          recommendations your team can act on.
        </p>
      </header>

      <Callout title="Positioning">
        Convertly is a conversion / CRO / business-readiness product — not an SEO suite, keyword
        tracker, or Lighthouse replacement. Lightweight technical signals (headings, ALT, robots,
        sitemap, OG/Twitter, schema) appear inside the conversion report as supporting context only.
      </Callout>

      <DocumentationSection id="mission" title="Mission" icon={Target}>
        <p>
          Help modern teams improve website conversion with focused automated analysis, clear
          prioritization, and implementation guidance they can actually ship.
        </p>
      </DocumentationSection>

      <DocumentationSection id="vision" title="Vision" icon={Telescope}>
        <p>
          A world where every growth team has the same clarity on funnel health that the best
          conversion agencies provide — embedded directly in their product workflow.
        </p>
      </DocumentationSection>

      <DocumentationSection id="audience" title="Who Convertly is for" icon={Users}>
        <InfoGrid>
          <DocumentationCard title="Product teams">
            Validate landing pages, signup flows, and pricing before major launches.
          </DocumentationCard>
          <DocumentationCard title="Growth & marketing">
            Prioritize CRO experiments with impact-weighted findings and playbook-ready fixes.
          </DocumentationCard>
          <DocumentationCard title="Founders & agencies">
            Run professional-grade conversion audits without building an internal CRO practice from
            scratch.
          </DocumentationCard>
        </InfoGrid>
      </DocumentationSection>

      <DocumentationSection id="why" title="Why Convertly exists" icon={Sparkles}>
        <p>
          Most audit tools produce generic checklists or SEO noise. Convertly combines
          intent-aware rule analysis with consultant-grade recommendations so teams know what to
          fix first and how to fix it — not just that something is wrong.
        </p>
      </DocumentationSection>

      <DocumentationSection id="capabilities" title="Platform capabilities" icon={Layers}>
        <FeatureList
          items={[
            "Page-specific and full-funnel conversion audits with intent-aware rule packs",
            "Growth Score (Intelligence v4) — weighted conversion impact, not issue count",
            "SPA-aware reliability that softens unverified form/DOM findings on JS-heavy sites",
            "Open Graph Page Previews on report cards (og:image metadata — not live screenshots)",
            "Prioritized recommendations with implementation playbooks",
            "Live audit execution UI, PDF/structured exports, and sample report",
            "Workspace domains, usage ledger, drafts, and Razorpay subscription billing",
            "Vertly — in-product Convertly specialist (rule-based guidance, not a general chatbot)",
            "Optional email notifications (audit complete, score-drop, weekly digest)",
          ]}
        />
      </DocumentationSection>

      <DocumentationSection id="preview" title="Page Preview" icon={Image}>
        <p>
          Report page cards can show a compact Page Preview from the website&apos;s publicly
          published Open Graph image (<code>og:image</code>) and favicon when available. Convertly
          does not claim ownership of those assets — they remain third-party content used only as
          reference thumbnails inside your audit report.
        </p>
      </DocumentationSection>

      <DocumentationSection id="vertly" title="Vertly" icon={MessageSquare}>
        <p>
          Vertly is Convertly&apos;s in-app product specialist. It answers questions about audits,
          plans, billing, and workspace using Convertly product memory and page context — not as an
          open-ended SEO or marketing chatbot.
        </p>
      </DocumentationSection>

      <DocumentationSection id="stack" title="Technology stack" icon={Code2}>
        <InfoGrid>
          <DocumentationCard title="Frontend">
            React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion, shadcn/ui
          </DocumentationCard>
          <DocumentationCard title="Backend & ops">
            Supabase (auth, Postgres, edge functions, RLS), Razorpay billing, Resend email,
            Playwright render worker, optional Sentry
          </DocumentationCard>
        </InfoGrid>
      </DocumentationSection>

      <DocumentationSection id="engine" title="Audit Engine" icon={Bot}>
        <p>
          Convertly&apos;s audit engine discovers public pages, acquires HTML via static fetch and
          optional Playwright rendering, detects website and page intent, runs a production rule
          catalog, applies render-reliability safeguards, then scores and recommends — without
          requiring code access to your site. Audits run in the browser tab; keep the tab open until
          completion.
        </p>
        <Callout title="Human in the loop">
          Recommendations are advisory. Convertly accelerates analysis; your team validates changes
          before deployment.
        </Callout>
      </DocumentationSection>

      <DocumentationSection id="roadmap" title="Roadmap" icon={Rocket}>
        <Timeline items={[...ROADMAP]} />
      </DocumentationSection>

      <DocumentationSection id="built-by" title="Built by HM Coding" icon={Zap}>
        <p>
          Convertly is designed, built, and operated by HM Coding — a technology firm focused on
          websites, web applications, and AI-driven product experiences for ambitious teams.
        </p>
      </DocumentationSection>

      <DocumentationSection id="contact" title="Contact" icon={Mail}>
        <p>
          Questions, partnerships, or feedback:{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
      </DocumentationSection>
    </article>
  )
}

export { AboutDocumentation }
