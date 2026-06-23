import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { AuditRunningExperience } from "@/components/audit/AuditRunningExperience"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { auditDetailPath } from "@/lib/routes"
import * as auditService from "@/services/auditService"
import type { AuditSessionStatus } from "@/types/auditEngine"
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

function NewAuditPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState("")
  const [selectedType, setSelectedType] = useState<string>(auditTypes[0].id)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlWarning, setUrlWarning] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<AuditSessionStatus>("pending")

  useEffect(() => {
    if (!activeAuditId || !isRunning) return

    const interval = window.setInterval(async () => {
      const session = await auditService.getAuditSession(activeAuditId)
      if (session) {
        setSessionStatus(session.status)
      }
    }, 400)

    return () => window.clearInterval(interval)
  }, [activeAuditId, isRunning])

  const handleStartAudit = async () => {
    const validation = await auditService.validateAuditUrlInput(url)
    if (!validation.valid) {
      setUrlError(validation.errors[0] ?? "Enter a valid website URL")
      setUrlWarning(null)
      return
    }

    setUrlError(null)
    setUrlWarning(validation.warnings[0] ?? null)
    setIsRunning(true)
    setSessionStatus("pending")

    try {
      const audit = await auditService.createAudit({ url: validation.sanitizedUrl })
      setActiveAuditId(audit.id)

      const finalStatus = await auditService.waitForAuditCompletion(audit.id)

      if (finalStatus === "failed") {
        setUrlError("Audit could not be completed. Check the URL and try again.")
        setIsRunning(false)
        setActiveAuditId(null)
        return
      }

      navigate(auditDetailPath(audit.id))
    } catch {
      setUrlError("Unable to start audit. Please try again.")
      setIsRunning(false)
      setActiveAuditId(null)
    }
  }

  const handleValidateUrl = async () => {
    const validation = await auditService.validateAuditUrlInput(url)
    if (!validation.valid) {
      setUrlError(validation.errors[0] ?? "Enter a valid website URL")
      setUrlWarning(null)
      return
    }

    setUrlError(null)
    setUrlWarning(validation.warnings[0] ?? null)
  }

  if (isRunning) {
    return (
      <AppPageShell
        header={
          <AppPageHeader
            eyebrow="Audits"
            title="Running audit"
            description="Convertly is discovering pages and preparing your conversion report."
          />
        }
      >
        <AuditRunningExperience status={sessionStatus} />
      </AppPageShell>
    )
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
      <Card className="app-card-body audit-target-card hover:translate-y-0">
        <SectionHeader
          variant="app"
          title="Audit target"
          description="Enter the primary domain or URL to include in this run."
          className="audit-target-card__header"
        />
        <div className="audit-target-card__field">
          <label htmlFor="audit-target-url" className="audit-target-card__label">
            Website URL
          </label>
          <div className="audit-target-card__row">
            <input
              id="audit-target-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (urlError) setUrlError(null)
                if (urlWarning) setUrlWarning(null)
              }}
              placeholder="https://yourcompany.com"
              disabled={isRunning}
              aria-invalid={Boolean(urlError)}
              className={cn(
                "app-input min-w-0 w-full disabled:opacity-60",
                urlError &&
                  "border-[color-mix(in_srgb,#f87171_50%,var(--border))] focus:border-[color-mix(in_srgb,#f87171_50%,var(--border))]"
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="default"
              className="w-full sm:w-auto"
              disabled={isRunning}
              onClick={() => void handleValidateUrl()}
            >
              Validate URL
            </Button>
          </div>
          {urlError ? (
            <Text size="sm" className="audit-target-card__error max-w-none text-[#fca5a5]">
              {urlError}
            </Text>
          ) : null}
          {!urlError && urlWarning ? (
            <Text size="sm" className="max-w-none text-[#fde68a]">
              {urlWarning}
            </Text>
          ) : null}
        </div>
      </Card>

      <AppPageSection
        eyebrow="Templates"
        title="Choose audit type"
        description="Select the scope that matches your current growth initiative."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auditTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              disabled={isRunning}
              onClick={() => setSelectedType(type.id)}
              className="h-full text-left disabled:opacity-60"
            >
              <Card
                className={cn(
                  "app-card-metric flex h-full min-h-[11.5rem] flex-col gap-4 transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:translate-y-0 hover:border-[color-mix(in_srgb,var(--accent)_22%,var(--border))] hover:bg-[color-mix(in_srgb,var(--surface)_55%,transparent)]",
                  selectedType === type.id &&
                    "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
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
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            disabled={isRunning}
            onClick={() => void handleStartAudit()}
          >
            Start audit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={isRunning}
          >
            Save as draft
          </Button>
        </div>
      </div>
    </AppPageShell>
  )
}

export default NewAuditPage
