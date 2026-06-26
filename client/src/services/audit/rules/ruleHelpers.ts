import { parseDomainFromUrl } from "@/lib/auditUrlValidation"
import {
  getHomepageSnapshot,
  getSuccessfulHtml,
  type PageContentSnapshot,
} from "@/services/audit/pageContentService"
import type { AuditRuleContext } from "@/types/auditEngine"

export function requireHomepage(context: AuditRuleContext): PageContentSnapshot | null {
  const snapshot = getHomepageSnapshot(context.pageSnapshots)
  if (!snapshot?.fetchSucceeded || !snapshot.document) return null
  return snapshot
}

/** Returns the page under analysis (V2 per-page pipeline) or homepage fallback */
export function requireAnalyzablePage(context: AuditRuleContext): PageContentSnapshot | null {
  const snapshot = context.currentPageSnapshot ?? getHomepageSnapshot(context.pageSnapshots)
  if (!snapshot?.fetchSucceeded || !snapshot.document) return null
  return snapshot
}

export function hasSuccessfulAnalysis(context: AuditRuleContext): boolean {
  return context.pageSnapshots.some((snapshot) => snapshot.fetchSucceeded && snapshot.html)
}

export function auditedHtml(context: AuditRuleContext): string {
  return getSuccessfulHtml(context.pageSnapshots)
}

export function auditDomain(context: AuditRuleContext): string {
  return parseDomainFromUrl(context.session.websiteUrl)
}

export function homepagePath(context: AuditRuleContext): string {
  const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
  return homepage?.path ?? "/"
}

export function homepageUrl(context: AuditRuleContext): string {
  const homepage = getHomepageSnapshot(context.pageSnapshots)?.page
  return homepage?.url ?? context.session.websiteUrl
}
