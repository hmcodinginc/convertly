import { fetchPageRemote } from "@/services/audit/remotePageFetch"

export type SiteTechnicalProbes = {
  robotsTxtFound: boolean | null
  sitemapXmlFound: boolean | null
  mixedContentHint: boolean
}

function originFromWebsiteUrl(websiteUrl: string): string | null {
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(websiteUrl)
      ? websiteUrl
      : `https://${websiteUrl}`
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

async function probeExists(url: string): Promise<boolean | null> {
  try {
    const result = await fetchPageRemote(url)
    if (result.ok && result.html && result.html.trim().length > 0) return true
    if (result.status === 404) return false
    // Non-404 failure (blocked, timeout) — unknown, do not invent a finding.
    return null
  } catch {
    return null
  }
}

/**
 * Lightweight origin probes reused by site-level technical rules.
 * Uses the existing audit-fetch path (robots/sitemap may be text/plain).
 */
export async function probeSiteTechnicalSignals(input: {
  websiteUrl: string
  combinedHtml: string
}): Promise<SiteTechnicalProbes> {
  const origin = originFromWebsiteUrl(input.websiteUrl)
  const mixedContentHint = /(?:src|href)=["']http:\/\//i.test(input.combinedHtml)

  if (!origin) {
    return {
      robotsTxtFound: null,
      sitemapXmlFound: null,
      mixedContentHint,
    }
  }

  const [robotsTxtFound, sitemapXmlFound] = await Promise.all([
    probeExists(`${origin}/robots.txt`),
    probeExists(`${origin}/sitemap.xml`),
  ])

  return {
    robotsTxtFound,
    sitemapXmlFound,
    mixedContentHint,
  }
}
