import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  Gauge,
  Lightbulb,
  Target,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react"
import { useState, type ReactNode } from "react"

import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { Drawer } from "@/components/feedback/Drawer"
import { useVertlyPlaybookPageContext } from "@/features/audits/hooks/useVertlyPlaybookPageContext"
import type { Recommendation, RecommendationPlaybook } from "@/types/audit"
import { cn } from "@/lib/utils"

import "./recommendation-playbook-drawer.css"

const priorityVariant = {
  Critical: "danger",
  High: "warning",
  Medium: "neutral",
} as const

type PlaybookSectionProps = {
  icon: ReactNode
  title: string
  children: React.ReactNode
  className?: string
}

function PlaybookSection({ icon, title, children, className }: PlaybookSectionProps) {
  return (
    <section className={cn("playbook-section", className)}>
      <header className="playbook-section__header">
        <span className="playbook-section__icon" aria-hidden>
          {icon}
        </span>
        <h3 className="playbook-section__title">{title}</h3>
      </header>
      <div className="playbook-section__body">{children}</div>
    </section>
  )
}

function PlaybookCodeBlock({
  language,
  code,
  caption,
}: NonNullable<RecommendationPlaybook["exampleCode"]>) {
  return (
    <figure className="playbook-code">
      {caption ? <figcaption className="playbook-code__caption">{caption}</figcaption> : null}
      <div className="playbook-code__shell">
        <span className="playbook-code__lang">{language}</span>
        <pre className="playbook-code__pre">
          <code>{code}</code>
        </pre>
      </div>
    </figure>
  )
}

function PlaybookChecklist({
  items,
}: {
  items: RecommendationPlaybook["checklist"]
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  return (
    <ul className="playbook-checklist">
      {items.map((item, index) => {
        const isDone = checked[item.id] ?? item.done
        return (
          <li key={`${item.id}-${index}`} className="playbook-checklist__item">
            <button
              type="button"
              className={cn("playbook-checklist__toggle", isDone && "playbook-checklist__toggle--done")}
              onClick={() =>
                setChecked((prev) => ({ ...prev, [item.id]: !isDone }))
              }
              aria-pressed={isDone}
            >
              {isDone ? (
                <CheckCircle2 className="size-4" aria-hidden />
              ) : (
                <Circle className="size-4" aria-hidden />
              )}
              <span>{item.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function RecommendationPlaybookContent({ playbook }: { playbook: RecommendationPlaybook }) {
  return (
    <div className="playbook-drawer">
      <div className="playbook-drawer__meta">
        <StatusBadge
          label={playbook.priority}
          variant={priorityVariant[playbook.priority]}
        />
        <span className="playbook-drawer__chip">
          <Gauge className="size-3.5" aria-hidden />
          {playbook.difficultyLabel}
        </span>
        <span className="playbook-drawer__chip">
          <Clock className="size-3.5" aria-hidden />
          {playbook.estimatedTime}
        </span>
      </div>

      <div className="playbook-drawer__gain">
        <TrendingUp className="size-4 text-[#86efac]" aria-hidden />
        <div>
          <p className="playbook-drawer__gain-label">Expected improvement</p>
          <p className="playbook-drawer__gain-value">{playbook.expectedImprovement}</p>
        </div>
      </div>

      <PlaybookSection icon={<AlertTriangle className="size-4" />} title="Problem">
        <p className="playbook-copy">{playbook.problem}</p>
      </PlaybookSection>

      <PlaybookSection icon={<Lightbulb className="size-4" />} title="Why it matters">
        <p className="playbook-copy">{playbook.whyItMatters}</p>
      </PlaybookSection>

      {playbook.whyHappened ? (
        <PlaybookSection icon={<Target className="size-4" />} title="Why this happened">
          <p className="playbook-copy">{playbook.whyHappened}</p>
        </PlaybookSection>
      ) : null}

      {playbook.userImpact ? (
        <PlaybookSection icon={<AlertTriangle className="size-4" />} title="User impact">
          <p className="playbook-copy">{playbook.userImpact}</p>
        </PlaybookSection>
      ) : null}

      <PlaybookSection icon={<Target className="size-4" />} title="Business impact">
        <p className="playbook-copy">{playbook.businessImpact}</p>
      </PlaybookSection>

      {playbook.priorityReason ? (
        <PlaybookSection icon={<Gauge className="size-4" />} title="Priority reason">
          <p className="playbook-copy">{playbook.priorityReason}</p>
        </PlaybookSection>
      ) : null}

      <PlaybookSection icon={<Code2 className="size-4" />} title="Technical explanation">
        <p className="playbook-copy playbook-copy--mono">{playbook.technicalExplanation}</p>
      </PlaybookSection>

      <PlaybookSection icon={<Zap className="size-4" />} title="Exact implementation">
        <p className="playbook-copy">{playbook.implementation}</p>
      </PlaybookSection>

      {playbook.exampleCode ? (
        <PlaybookSection icon={<Code2 className="size-4" />} title="Example">
          <PlaybookCodeBlock {...playbook.exampleCode} />
        </PlaybookSection>
      ) : null}

      <PlaybookSection icon={<Wrench className="size-4" />} title="Implementation checklist">
        <PlaybookChecklist items={playbook.checklist} />
      </PlaybookSection>

      {playbook.relatedRecommendations && playbook.relatedRecommendations.length > 0 ? (
        <PlaybookSection icon={<TrendingUp className="size-4" />} title="Related recommendations">
          <ul className="playbook-related">
            {playbook.relatedRecommendations.map((ruleId) => (
              <li key={ruleId} className="playbook-related__item">
                {ruleId.replace(/-/g, " ")}
              </li>
            ))}
          </ul>
        </PlaybookSection>
      ) : null}
    </div>
  )
}

type RecommendationPlaybookDrawerProps = {
  open: boolean
  onClose: () => void
  recommendation: Recommendation | null
  playbook: RecommendationPlaybook | null
  domain?: string
}

function RecommendationPlaybookDrawer({
  open,
  onClose,
  recommendation,
  playbook,
  domain,
}: RecommendationPlaybookDrawerProps) {
  useVertlyPlaybookPageContext({
    open,
    playbook,
    recommendation,
    domain,
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={recommendation?.title ?? playbook?.title ?? "Playbook"}
      description={recommendation?.category ?? playbook?.ruleId}
      className="max-w-lg"
      contentClassName="playbook-drawer-panel"
    >
      {playbook ? <RecommendationPlaybookContent playbook={playbook} /> : null}
    </Drawer>
  )
}

export {
  RecommendationPlaybookContent,
  RecommendationPlaybookDrawer,
}
