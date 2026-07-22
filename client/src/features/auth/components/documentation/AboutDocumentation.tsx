import {
  Bot,
  Code2,
  Layers,
  Mail,
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
    title: "MVP launch",
    description:
      "Automated conversion audits, Growth Score, prioritized recommendations, implementation playbooks, workspace domains, and subscription billing.",
  },
  {
    id: "next",
    phase: "Next",
    title: "Team workflows",
    description:
      "Shared workspaces, audit comparisons, exportable reports, and deeper integration with analytics stacks.",
  },
  {
    id: "future",
    phase: "Future",
    title: "Continuous optimization",
    description:
      "Scheduled audits, regression alerts, A/B experiment tracking, and enterprise compliance tooling.",
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
          Convertly turns website audits into prioritized, actionable growth work — so product and
          marketing teams spend less time guessing and more time improving conversion.
        </p>
      </header>

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
            Prioritize CRO experiments with estimated lift and playbook-ready fixes.
          </DocumentationCard>
          <DocumentationCard title="Founders & agencies">
            Run professional-grade audits without building an internal CRO practice from scratch.
          </DocumentationCard>
        </InfoGrid>
      </DocumentationSection>

      <DocumentationSection id="why" title="Why Convertly exists" icon={Sparkles}>
        <p>
          Most audit tools produce generic checklists. Convertly combines deterministic rule
          analysis with consultant-grade recommendations so teams know what to fix first and how
          to fix it — not just that something is wrong.
        </p>
      </DocumentationSection>

      <DocumentationSection id="capabilities" title="Platform capabilities" icon={Layers}>
        <FeatureList
          items={[
            "Full-funnel conversion audits with Growth Score breakdown",
            "100+ deterministic rules across CRO, UX, trust, mobile, and SEO",
            "Prioritized recommendations with implementation playbooks",
            "Audit history, score trends, and workspace domain management",
            "Premium execution experience with live pipeline visibility",
          ]}
        />
      </DocumentationSection>

      <DocumentationSection id="stack" title="Technology stack" icon={Code2}>
        <InfoGrid>
          <DocumentationCard title="Frontend">
            React, TypeScript, Vite, Tailwind CSS v4, Framer Motion, shadcn/ui
          </DocumentationCard>
          <DocumentationCard title="Backend">
            Supabase (auth, database, edge functions), secure payment integrations
          </DocumentationCard>
        </InfoGrid>
      </DocumentationSection>

      <DocumentationSection id="engine" title="Audit Engine" icon={Bot}>
        <p>
          Convertly&apos;s audit engine crawls public pages, renders DOM snapshots, runs a
          production rule catalog, and synthesizes consultant-style recommendations with score
          explainability — all without requiring code access to your site.
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
