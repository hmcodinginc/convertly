import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { AuditAllowanceBadge } from "@/components/audit/AuditAllowanceBadge"
import { AuditLimitReachedCard } from "@/components/audit/AuditLimitReachedCard"
import { AuditExecutionView } from "@/components/audit/execution/AuditExecutionView"
import { AuthFormMessage } from "@/components/auth/AuthFormMessage"
import { Button } from "@/components/ui/button"
import { AppPageHeader } from "@/components/layout/AppPageHeader"
import { AppPageSection } from "@/components/layout/AppPageSection"
import { AppPageShell } from "@/components/layout/AppPageShell"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { Card } from "@/components/surfaces/Card"
import { Text } from "@/components/ui/typography/Text"
import { useAuthSession } from "@/hooks/useAuthSession"
import { useAsyncData } from "@/hooks/useAsyncData"
import type { NewAuditLocationState } from "@/lib/auditNavigation"
import {
  AUDIT_TYPE_OPTIONS,
  getDefaultAuditTemplateId,
  isAuditTemplateId,
  type AuditTemplateId,
} from "@/lib/auditTypes"
import { isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { auditDetailPath, ROUTES } from "@/lib/routes"
import { showErrorToast, showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import * as auditService from "@/services/auditService"
import { getAuditEntitlement } from "@/services/entitlementService"
import type { AuditDetail } from "@/types/audit"
import { AuditLimitError } from "@/types/billing"

function NewAuditPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuthSession()
  const autoStartConsumed = useRef(false)
  const resumeStateConsumed = useRef(false)
  const [url, setUrl] = useState("")
  const [draftId, setDraftId] = useState<string | undefined>()
  const [selectedType, setSelectedType] = useState<AuditTemplateId>(getDefaultAuditTemplateId())
  const [urlError, setUrlError] = useState<string | null>(null)
  const [urlWarning, setUrlWarning] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [runningAuditId, setRunningAuditId] = useState<string | null>(null)

  const { data: entitlement } = useAsyncData(
    () => getAuditEntitlement(session!.userId),
    [session?.userId],
    { enabled: Boolean(session?.userId) && isBusinessFoundationEnabled() }
  )

  const auditLimitReached = entitlement?.blockedByLimit ?? false
  const auditBlocked = entitlement != null && !entitlement.allowed

  useEffect(() => {
    const state = (location.state as NewAuditLocationState | null) ?? {}
    if (resumeStateConsumed.current || state.autoStart) return

    const hasResumeState = Boolean(state.url || state.draftId || state.auditType)
    if (!hasResumeState) return

    resumeStateConsumed.current = true

    if (state.url) setUrl(state.url)
    if (state.draftId) setDraftId(state.draftId)
    if (state.auditType && isAuditTemplateId(state.auditType)) {
      setSelectedType(state.auditType)
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const executeAudit = useCallback(
    async (urlToRun: string) => {
      if (auditLimitReached) return

      const validation = await auditService.validateAuditUrlInput(urlToRun)
      if (!validation.valid) {
        setUrlError(validation.errors[0] ?? "Enter a valid website URL")
        setUrlWarning(null)
        setIsRunning(false)
        return
      }

      setUrlError(null)
      setUrlWarning(validation.warnings[0] ?? null)
      setIsRunning(true)
      setRunningAuditId(null)

      try {
        const audit = await auditService.createAudit({
          url: validation.sanitizedUrl,
          auditType: selectedType,
          draftId,
        })
        setRunningAuditId(audit.id)
      } catch (error) {
        if (error instanceof AuditLimitError) {
          setUrlError(error.message)
          setIsRunning(false)
          return
        }
        const message =
          error instanceof Error ? error.message : "Unable to start audit. Please try again."
        setUrlError(
          message === "Audit timed out"
            ? "The audit took too long to complete. The site may be slow or blocking automated access."
            : message
        )
        setIsRunning(false)
      }
    },
    [auditLimitReached, draftId, selectedType]
  )

  const handleStartAudit = () => {
    if (auditLimitReached || auditBlocked) return
    void executeAudit(url)
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setUrlError(null)

    try {
      const draft = await auditService.saveAuditDraft({
        url,
        auditType: selectedType,
        draftId,
      })
      setDraftId(draft.id)
      showToast({
        variant: "success",
        title: "Draft saved",
        description: "Resume this audit anytime from your dashboard.",
      })
      navigate(ROUTES.dashboard)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save draft. Please try again."
      setUrlError(message)
      showErrorToast("Unable to save draft", error)
    } finally {
      setIsSavingDraft(false)
    }
  }

  useEffect(() => {
    const state = (location.state as NewAuditLocationState | null) ?? {}
    if (!state.autoStart || !state.url || autoStartConsumed.current) return

    autoStartConsumed.current = true
    setUrl(state.url)
    if (state.auditType && isAuditTemplateId(state.auditType)) {
      setSelectedType(state.auditType)
    }
    if (state.draftId) setDraftId(state.draftId)
    navigate(location.pathname, { replace: true, state: null })

    if (auditLimitReached) return

    void executeAudit(state.url)
  }, [
    auditLimitReached,
    executeAudit,
    location.pathname,
    location.state,
    navigate,
  ])

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

  if (isRunning && runningAuditId) {
    return (
      <AppPageShell header={null} sectionsClassName="gap-0">
        <AuditExecutionView
          auditId={runningAuditId}
          onComplete={(detail: AuditDetail) => {
            navigate(auditDetailPath(detail.id))
          }}
          onFailed={(errorMessage) => {
            setUrlError(
              errorMessage ??
                "Audit could not be completed. Check the URL and try again."
            )
            setIsRunning(false)
            setRunningAuditId(null)
          }}
          onBackToNewAudit={() => {
            setIsRunning(false)
            setRunningAuditId(null)
          }}
          onRetry={() => {
            void executeAudit(url)
          }}
        />
      </AppPageShell>
    )
  }

  if (isRunning) {
    return (
      <AppPageShell header={null} sectionsClassName="gap-0">
        <div className="min-h-[24rem]" aria-busy aria-label="Starting audit" />
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
          actions={
            entitlement ? <AuditAllowanceBadge entitlement={entitlement} /> : undefined
          }
        />
      }
    >
      {auditLimitReached && entitlement ? (
        <AuditLimitReachedCard entitlement={entitlement} />
      ) : null}

      {!auditLimitReached && auditBlocked ? (
        <AuthFormMessage>
          Your subscription is not active. Visit billing to restore audit access.
        </AuthFormMessage>
      ) : null}

      {!auditLimitReached ? (
        <>
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
                  disabled={isRunning || isSavingDraft}
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
                  disabled={isRunning || isSavingDraft}
                  onClick={() => void handleValidateUrl()}
                >
                  Validate URL
                </Button>
              </div>
              {urlError ? (
                <AuthFormMessage className="audit-target-card__error">
                  {urlError}
                </AuthFormMessage>
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
              {AUDIT_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  disabled={isRunning || isSavingDraft}
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
                disabled={isRunning || isSavingDraft || auditBlocked}
                onClick={handleStartAudit}
              >
                Start audit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={isRunning || isSavingDraft}
                onClick={() => void handleSaveDraft()}
              >
                {isSavingDraft ? "Saving draft…" : "Save as draft"}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </AppPageShell>
  )
}

export default NewAuditPage
