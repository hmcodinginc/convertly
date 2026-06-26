import { parseDomainFromUrl } from "@/lib/auditUrlValidation"
import {
  getHomepageSnapshot,
  getSuccessfulHtml,
  type PageContentSnapshot,
} from "@/services/audit/pageContentService"
import { getSnapshotMetrics, type SnapshotMetrics } from "@/services/audit/rules/snapshotMetrics"
import type { PageRuleContext, SiteRuleContext } from "@/services/audit/intelligence/types"
import type { AuditPage } from "@/types/auditEngine"

export type PageDetectorContext = {
  snapshot: PageContentSnapshot
  metrics: SnapshotMetrics
  document: Document
  domain: string
  page: AuditPage
  pageUrl: string
  pagePath: string
}

export type SiteDetectorContext = {
  domain: string
  pages: AuditPage[]
  pageSnapshots: PageContentSnapshot[]
  combinedHtml: string
  homepage: PageContentSnapshot | null
}

export function buildPageDetectorContext(context: PageRuleContext): PageDetectorContext | null {
  const snapshot = context.currentSnapshot
  if (!snapshot?.fetchSucceeded || !snapshot.document) return null

  return {
    snapshot,
    metrics: getSnapshotMetrics(snapshot),
    document: snapshot.document,
    domain: parseDomainFromUrl(context.session.websiteUrl),
    page: snapshot.page,
    pageUrl: snapshot.finalUrl ?? snapshot.page.url,
    pagePath: snapshot.page.path,
  }
}

export function buildSiteDetectorContext(context: SiteRuleContext): SiteDetectorContext {
  return {
    domain: parseDomainFromUrl(context.session.websiteUrl),
    pages: context.pages,
    pageSnapshots: context.pageSnapshots,
    combinedHtml: getSuccessfulHtml(context.pageSnapshots),
    homepage: getHomepageSnapshot(context.pageSnapshots),
  }
}

export function siteHasReachablePageType(pages: AuditPage[], pageType: AuditPage["pageType"]): boolean {
  return pages.some((page) => page.pageType === pageType && page.discoveryStatus === "reachable")
}

export function htmlContainsLinkPattern(html: string | null, patterns: RegExp[]): boolean {
  if (!html) return false
  return patterns.some((pattern) => pattern.test(html))
}
