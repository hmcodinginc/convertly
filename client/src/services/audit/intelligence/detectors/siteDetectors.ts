import type { DetectorResult } from "@/services/audit/intelligence/types"
import {
  buildSiteDetectorContext,
  htmlContainsLinkPattern,
  siteHasReachablePageType,
  type SiteDetectorContext,
} from "@/services/audit/intelligence/detectors/context"
import { getSnapshotMetrics } from "@/services/audit/rules/snapshotMetrics"

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
    const snapshots = c.pageSnapshots.filter((s) => s.fetchSucceeded && s.document)
    if (snapshots.length < 3) return pass()
    const linkCounts = snapshots.map((s) => getSnapshotMetrics(s).linkCount)
    const min = Math.min(...linkCounts)
    const max = Math.max(...linkCounts)
    if (max - min <= 12) return pass()
    return fail(72, [
      { label: "Link count range", value: `${min}–${max} across analyzed pages` },
    ])
  },

  "site-weak-internal-linking": (c) => {
    const analyzed = c.pageSnapshots.filter((s) => s.fetchSucceeded && s.document)
    if (analyzed.length < 4) return pass()
    const avgLinks =
      analyzed.reduce((sum, s) => sum + getSnapshotMetrics(s).linkCount, 0) / analyzed.length
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

  "site-missing-pricing-link": (c) => {
    if (siteHasReachablePageType(c.pages, "pricing")) return pass()
    const hasPricing = htmlContainsLinkPattern(c.combinedHtml, [
      /href=["'][^"']*pricing/i,
      /href=["'][^"']*plans/i,
    ])
    if (hasPricing) return pass()
    return fail(72, [{ label: "Pricing link", value: "No pricing page or nav link discovered" }])
  },

  "site-missing-blog-link": (c) => {
    const hasBlogPage = c.pages.some(
      (page) =>
        page.discoveryStatus === "reachable" &&
        /blog|articles|resources|news/i.test(page.path)
    )
    if (hasBlogPage) return pass()
    const hasBlog = htmlContainsLinkPattern(c.combinedHtml, [
      /href=["'][^"']*blog/i,
      /href=["'][^"']*resources/i,
      /href=["'][^"']*articles/i,
    ])
    if (hasBlog) return pass()
    return fail(64, [{ label: "Blog link", value: "No blog or resources link discovered" }])
  },

  "site-missing-robots-txt": (c) => {
    const found = c.technicalProbes?.robotsTxtFound
    if (found == null) return pass()
    if (found) return pass()
    return fail(70, [{ label: "robots.txt", value: "Not found at /robots.txt" }])
  },

  "site-missing-sitemap": (c) => {
    const found = c.technicalProbes?.sitemapXmlFound
    if (found == null) return pass()
    if (found) return pass()
    const referenced = /sitemap\.xml|rel=["']sitemap["']/i.test(c.combinedHtml)
    if (referenced) return pass()
    return fail(68, [{ label: "sitemap.xml", value: "Not found at /sitemap.xml" }])
  },

  "site-unreachable-internal-pages": (c) => {
    const unreachable = c.pages.filter((page) => page.discoveryStatus === "unreachable")
    if (unreachable.length === 0) return pass()
    const sample = unreachable
      .slice(0, 3)
      .map((page) => page.path)
      .join(", ")
    return fail(74, [
      { label: "Unreachable discovered pages", value: String(unreachable.length) },
      { label: "Examples", value: sample },
    ])
  },

  "site-mixed-content": (c) => {
    if (!c.technicalProbes?.mixedContentHint) return pass()
    return fail(72, [
      {
        label: "Mixed content",
        value: "http:// resource URLs detected on analyzed HTTPS pages",
      },
    ])
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
