import type { AuditPage } from "@/types/auditEngine"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import type { WebsiteIntent } from "@/services/audit/intelligence/websiteIntentTypes"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import {
  getRuleScoringProfile,
  isBlockerApplicableToPage,
} from "@/services/audit/intelligence/rules/ruleScoringMetadata"
import { GROWTH_SCORE_POLICY } from "@/services/audit/intelligence/scoring/scoringPolicy"
import {
  VIEWPORT_RULE_ID,
  isViewportFindingEligibleForBlockerCeiling,
} from "@/services/audit/intelligence/scoring/viewportBlockerEligibility"

export type AppliedBlocker = {
  ruleId: string
  title: string
  capScore: number
  blockerTier: number
  pageId?: string
  pagePath?: string
}

export type BlockerCeilingResult = {
  /** Lowest applicable cap — maximum Growth Score achievable until resolved */
  scoreCeiling: number
  appliedBlockers: AppliedBlocker[]
}

export type BlockerCeilingOptions = {
  /** All scorable findings — used for behavioral co-evidence checks */
  allFindings?: IntelligenceFindingDraft[]
  websiteIntent?: WebsiteIntent
}

function pageById(pages: AuditPage[], pageId?: string): AuditPage | undefined {
  if (!pageId) return undefined
  return pages.find((page) => page.id === pageId)
}

/**
 * Blocker eligibility gate — separates implementation best practices from UX outcomes.
 * Does not change penalties; only whether a finding may cap Growth Score.
 */
function isEligibleForBlockerCeiling(
  finding: IntelligenceFindingDraft,
  pages: AuditPage[],
  options: BlockerCeilingOptions
): boolean {
  if (finding.ruleId === VIEWPORT_RULE_ID) {
    return isViewportFindingEligibleForBlockerCeiling(
      finding,
      options.allFindings ?? [finding],
      options.websiteIntent ?? "unknown"
    )
  }

  const meta = getRuleMetadata(finding.ruleId)
  if (!meta) return false

  const profile = getRuleScoringProfile(finding.ruleId, meta)
  if (!profile?.isBlocker || profile.capScore == null || profile.blockerTier == null) {
    return false
  }

  if (finding.pageId) {
    const page = pageById(pages, finding.pageId)
    if (!page) return false
    if (!isBlockerApplicableToPage(profile, page.pageType)) return false
  }

  return true
}

/**
 * Resolves the Growth Score ceiling from active blocker findings.
 * Lowest cap wins. Blockers scoped to page types only apply on matching pages.
 *
 * Viewport meta participates only when mobile behavioral outcomes also fail
 * (and never for platform intents). Findings still score normally via category penalties.
 */
export function resolveBlockerCeiling(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[],
  options: BlockerCeilingOptions = {}
): BlockerCeilingResult {
  const appliedBlockers: AppliedBlocker[] = []
  const allFindings = options.allFindings ?? findings

  for (const finding of findings) {
    const meta = getRuleMetadata(finding.ruleId)
    if (!meta) continue

    const profile = getRuleScoringProfile(finding.ruleId, meta)
    if (!profile?.isBlocker || profile.capScore == null || profile.blockerTier == null) {
      continue
    }

    if (
      !isEligibleForBlockerCeiling(finding, pages, {
        ...options,
        allFindings,
      })
    ) {
      continue
    }

    if (finding.pageId) {
      const page = pageById(pages, finding.pageId)
      if (!page) continue
      if (!isBlockerApplicableToPage(profile, page.pageType)) continue

      appliedBlockers.push({
        ruleId: finding.ruleId,
        title: finding.title,
        capScore: profile.capScore,
        blockerTier: profile.blockerTier,
        pageId: page.id,
        pagePath: page.path,
      })
      continue
    }

    // Site-scoped blockers always apply when eligible
    appliedBlockers.push({
      ruleId: finding.ruleId,
      title: finding.title,
      capScore: profile.capScore,
      blockerTier: profile.blockerTier,
    })
  }

  if (appliedBlockers.length === 0) {
    return {
      scoreCeiling: GROWTH_SCORE_POLICY.maxScore,
      appliedBlockers: [],
    }
  }

  const scoreCeiling = Math.min(...appliedBlockers.map((blocker) => blocker.capScore))

  return {
    scoreCeiling,
    appliedBlockers: appliedBlockers.sort((a, b) => a.capScore - b.capScore),
  }
}
