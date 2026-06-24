import { parseHtmlDocument } from "@/services/audit/pageContentService"
import { extractSameOriginLinks } from "@/services/audit/linkExtractor"
import type { HtmlQualityAssessment } from "@/services/audit/fetch/types"

const SPA_ROOT_PATTERNS = [
  /<div[^>]+id=["']root["']/i,
  /<div[^>]+id=["']app["']/i,
  /<div[^>]+id=["']__next["']/i,
  /<div[^>]+id=["']__nuxt["']/i,
]

const FRAMEWORK_PATTERNS = [
  /__NEXT_DATA__/i,
  /__NUXT__/i,
  /ng-version/i,
  /data-v-[a-f0-9]+/i,
  /react/i,
  /vite/i,
  /vue/i,
  /nuxt/i,
  /angular/i,
]

function getVisibleTextLength(html: string): number {
  const document = parseHtmlDocument(html)
  const text = document.body?.textContent ?? ""
  return text.replace(/\s+/g, " ").trim().length
}

function hasHeading(document: Document, tag: "h1" | "h2"): boolean {
  return Array.from(document.querySelectorAll(tag)).some((element) => {
    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim()
    return text.length > 0
  })
}

function hasSpaRoot(html: string): boolean {
  return SPA_ROOT_PATTERNS.some((pattern) => pattern.test(html))
}

function hasFrameworkSignal(html: string): boolean {
  const hasModuleScript = /<script[^>]+type=["']module["']/i.test(html)
  const hasAssetsBundle = /\/assets\//i.test(html)
  const hasFrameworkMarker = FRAMEWORK_PATTERNS.some((pattern) => pattern.test(html))
  return hasModuleScript || hasAssetsBundle || hasFrameworkMarker
}

export function assessHtmlQuality(baseUrl: string, html: string): HtmlQualityAssessment {
  const document = parseHtmlDocument(html)
  const reasons: string[] = []
  let confidence = 0

  const spaRoot = hasSpaRoot(html)
  const framework = hasFrameworkSignal(html)
  const hasH1 = hasHeading(document, "h1")
  const hasH2 = hasHeading(document, "h2")
  const visibleTextLength = getVisibleTextLength(html)
  const linkCount = extractSameOriginLinks(baseUrl, html).length

  if (spaRoot) {
    reasons.push("spa-root-detected")
    confidence += 0.22
  }

  if (framework) {
    reasons.push("framework-detected")
    confidence += 0.18
  }

  if (!hasH1) {
    reasons.push("missing-h1")
    confidence += 0.12
  }

  if (!hasH2) {
    reasons.push("missing-h2")
    confidence += 0.08
  }

  if (visibleTextLength < 180) {
    reasons.push("low-visible-content")
    confidence += 0.12
  }

  if (linkCount < 2) {
    reasons.push("low-link-count")
    confidence += 0.08
  }

  if (spaRoot && html.length < 4_000) {
    reasons.push("spa-shell-size")
    confidence += 0.05
  }

  const hasSpaSignal = spaRoot || framework
  const hasContentGap =
    !hasH1 || !hasH2 || visibleTextLength < 180 || linkCount < 2

  const shouldRender =
    confidence >= 0.55 && hasSpaSignal && hasContentGap

  return {
    shouldRender,
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
    reasons,
  }
}
