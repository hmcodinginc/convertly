import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { auditDetailPath } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import { cn } from "@/lib/utils"

const auditTypes = [
  {
    id: "full-funnel",
    title: "Full funnel audit",
    description:
      "Scan landing, pricing, signup, and checkout paths to surface end-to-end conversion leaks.",
    duration: "~18 min",
  },
  {
    id: "page-specific",
    title: "Page-specific audit",
    description:
      "Deep-dive a single URL for UX, copy, CTA placement, and technical performance signals.",
    duration: "~4 min",
  },
  {
    id: "competitive",
    title: "Competitive benchmark",
    description:
      "Compare your key pages against up to three competitors on clarity, trust, and friction.",
    duration: "~25 min",
  },
] as const

const AUDIT_SIMULATION_MS = 2200

function NewAuditPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState("")
  const [selectedType, setSelectedType] = useState<string>(auditTypes[0].id)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleStartAudit = async () => {
    const valid = await auditService.isValidAuditUrl(url)
    if (!valid) {
      setUrlError("Enter a valid website URL (e.g. https://yourcompany.com)")
      return
    }

    setUrlError(null)
    setIsRunning(true)

    window.setTimeout(async () => {
      try {
        const audit = await auditService.createAudit({ url })
        navigate(auditDetailPath(audit.id))
      } catch {
        setUrlError("Unable to start audit. Please try again.")
        setIsRunning(false)
      }
    }, AUDIT_SIMULATION_MS)
  }

  const handleValidateUrl = async () => {
    const valid = await auditService.isValidAuditUrl(url)
    if (!valid) {
      setUrlError("Enter a valid website URL (e.g. https://yourcompany.com)")
      return
    }
    setUrlError(null)
  }

  return (
    <AppPageShell
      header={
        <AppPageHeader
          eyebrow="Audits"
          title="New audit"
          description="Configure a conversion audit for your site. Results appear on the dashboard when the run completes."
        />
      }
    >
      <Card className="app-card-body app-card-stack hover:translate-y-0">
        <SectionHeader
          variant="app"
          title="Audit target"
          description="Enter the primary domain or URL to include in this run."
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block space-y-2">
            <Text size="sm" className="max-w-none font-medium text-foreground/80">
              Website URL
            </Text>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (urlError) setUrlError(null)
              }}
              placeholder="https://yourcompany.com"
              disabled={isRunning}
              aria-invalid={Boolean(urlError)}
              className={cn(
                "h-10 w-full rounded-[var(--radius-md)] border bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-3 text-sm text-foreground outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:opacity-60",
                urlError
                  ? "border-[color-mix(in_srgb,#f87171_50%,var(--border))]"
                  : "border-[color-mix(in_srgb,var(--border)_90%,transparent)]"
              )}
            />
            {urlError ? (
              <Text size="sm" className="max-w-none text-[#fca5a5]">
                {urlError}
              </Text>
            ) : null}
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={isRunning}
            onClick={() => void handleValidateUrl()}
          >
            Validate URL
          </Button>
        </div>
      </Card>

      <AppPageSection
        eyebrow="Templates"
        title="Choose audit type"
        description="Select the scope that matches your current growth initiative."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {auditTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              disabled={isRunning}
              onClick={() => setSelectedType(type.id)}
              className="text-left disabled:opacity-60"
            >
              <Card
                className={cn(
                  "app-card-metric flex h-full flex-col gap-4 hover:translate-y-0",
                  selectedType === type.id &&
                    "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
                )}
              >
                <div className="space-y-2">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {type.title}
                  </h3>
                  <Text variant="muted" size="sm" className="max-w-none leading-6">
                    {type.description}
                  </Text>
                </div>
                <Text variant="muted" size="sm" className="max-w-none text-xs">
                  Est. {type.duration}
                </Text>
              </Card>
            </button>
          ))}
        </div>
      </AppPageSection>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={isRunning}
            onClick={() => void handleStartAudit()}
          >
            {isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Running audit…
              </>
            ) : (
              "Start audit"
            )}
          </Button>
          <Button variant="outline" disabled={isRunning}>
            Save as draft
          </Button>
        </div>
        {isRunning ? (
          <Text variant="muted" size="sm" className="max-w-none">
            Scanning funnel pages and generating recommendations. You will be redirected
            when the audit completes.
          </Text>
        ) : null}
      </div>
    </AppPageShell>
  )
}

export default NewAuditPage
