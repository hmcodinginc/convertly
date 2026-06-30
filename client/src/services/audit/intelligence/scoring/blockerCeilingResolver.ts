import type { AuditPage } from "@/types/auditEngine"
import type { IntelligenceFindingDraft } from "@/services/audit/intelligence/types"
import { getRuleMetadata } from "@/services/audit/intelligence/rules/ruleMetadata"
import {
  getRuleScoringProfile,
  isBlockerApplicableToPage,
} from "@/services/audit/intelligence/rules/ruleScoringMetadata"
import { GROWTH_SCORE_POLICY } from "@/services/audit/intelligence/scoring/scoringPolicy"

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

function pageById(pages: AuditPage[], pageId?: string): AuditPage | undefined {
  if (!pageId) return undefined
  return pages.find((page) => page.id === pageId)
}

/**
 * Resolves the Growth Score ceiling from active blocker findings.
 * Lowest cap wins. Blockers scoped to page types only apply on matching pages.
 */
export function resolveBlockerCeiling(
  findings: IntelligenceFindingDraft[],
  pages: AuditPage[]
): BlockerCeilingResult {
  const appliedBlockers: AppliedBlocker[] = []

  for (const finding of findings) {
    const meta = getRuleMetadata(finding.ruleId)
    if (!meta) continue

    const profile = getRuleScoringProfile(finding.ruleId, meta)
    if (!profile?.isBlocker || profile.capScore == null || profile.blockerTier == null) {
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

    // Site-scoped blockers always apply
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
