import type { DetectorResult } from "@/services/audit/intelligence/types"
import {
  buildSiteDetectorContext,
  htmlContainsLinkPattern,
  siteHasReachablePageType,
  type SiteDetectorContext,
} from "@/services/audit/intelligence/detectors/context"

export type SiteDetector = (ctx: SiteDetectorContext) => DetectorResult

function pass(): DetectorResult {
  return { triggered: false, confidence: 0, evidence: [] }
}

function fail(
  confidence: number,
  items: Array<{ label: string; value: string }>
): DetectorResult {
  return { triggered: true, confidence, evidence: items }
}

export const SITE_DETECTORS: Record<string, SiteDetector> = {
  "trust-missing-contact-page": (c) => {
    if (siteHasReachablePageType(c.pages, "contact")) return pass()
    const contactLink = htmlContainsLinkPattern(c.combinedHtml, [/href=["'][^"']*contact/i])
    if (contactLink) return pass()
    return fail(90, [{ label: "Contact page", value: "No reachable contact page discovered" }])
  },

  "trust-missing-privacy-policy": (c) => {
    const hasPrivacy = htmlContainsLinkPattern(c.combinedHtml, [
      /href=["'][^"']*privacy[^"']*["']/i,
      /privacy policy/i,
    ])
    if (hasPrivacy) return pass()
    return fail(88, [{ label: "Privacy policy", value: "No link detected across analyzed pages" }])
  },

  "trust-missing-terms-page": (c) => {
    const hasTerms = htmlContainsLinkPattern(c.combinedHtml, [
      /href=["'][^"']*terms[^"']*["']/i,
      /terms of service/i,
      /terms & conditions/i,
    ])
    if (hasTerms) return pass()
    return fail(82, [{ label: "Terms page", value: "No terms link detected across analyzed pages" }])
  },

  "site-footer-missing-legal": (c) => {
    const footerHtml = c.homepage?.html ?? c.combinedHtml
    const hasLegal = htmlContainsLinkPattern(footerHtml, [/privacy/i, /terms/i, /legal/i])
    if (hasLegal) return pass()
    return fail(80, [{ label: "Footer legal links", value: "Privacy or terms not found in homepage/footer markup" }])
  },

  "site-inconsistent-navigation": (c) => {
    const snapshots = c.pageSnapshots.filter((s) => s.fetchSucceeded && s.renderDiagnostics)
    if (snapshots.length < 3) return pass()
    const linkCounts = snapshots.map((s) => s.renderDiagnostics?.linkCount ?? 0)
    const min = Math.min(...linkCounts)
    const max = Math.max(...linkCounts)
    if (max - min <= 12) return pass()
    return fail(72, [
      { label: "Link count range", value: `${min}–${max} across rendered pages` },
    ])
  },

  "site-weak-internal-linking": (c) => {
    const analyzed = c.pageSnapshots.filter((s) => s.fetchSucceeded)
    if (analyzed.length < 4) return pass()
    const avgLinks =
      analyzed.reduce((sum, s) => sum + (s.renderDiagnostics?.linkCount ?? 0), 0) / analyzed.length
    if (avgLinks >= 6) return pass()
    return fail(70, [{ label: "Average links per page", value: avgLinks.toFixed(1) }])
  },

  "site-missing-about-link": (c) => {
    if (siteHasReachablePageType(c.pages, "about")) return pass()
    const hasAbout = htmlContainsLinkPattern(c.combinedHtml, [/href=["'][^"']*about/i, /about us/i])
    if (hasAbout) return pass()
    return fail(74, [{ label: "About page", value: "No about page or link discovered" }])
  },

  "site-missing-services-link": (c) => {
    if (siteHasReachablePageType(c.pages, "services")) return pass()
    const hasServices = htmlContainsLinkPattern(c.combinedHtml, [
      /href=["'][^"']*services/i,
      /href=["'][^"']*solutions/i,
    ])
    if (hasServices) return pass()
    return fail(74, [{ label: "Services page", value: "No services page or link discovered" }])
  },
}

export function runSiteDetector(
  ruleId: string,
  context: Parameters<typeof buildSiteDetectorContext>[0]
): DetectorResult {
  const siteCtx = buildSiteDetectorContext(context)
  const detector = SITE_DETECTORS[ruleId]
  if (!detector) return pass()
  return detector(siteCtx)
}
