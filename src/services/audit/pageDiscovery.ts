import { COMMON_PAGE_DEFINITIONS } from "@/services/audit/constants"
import type {
  AuditPageType,
  DiscoveredPageCandidate,
  PageDiscoveryStatus,
} from "@/types/auditEngine"

export type PageDiscoveryProvider = {
  discover: (baseUrl: string) => Promise<DiscoveredPageCandidate[]>
}

function buildPageUrl(baseUrl: string, path: string): string {
  const base = new URL(baseUrl)
  if (path === "/") {
    return base.origin
  }
  return new URL(path, base.origin).toString()
}

async function probePageReachability(url: string): Promise<PageDiscoveryStatus> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
      signal: controller.signal,
      redirect: "follow",
    })

    if (response.ok || response.status === 405) {
      return "reachable"
    }

    if (response.status === 404) {
      return "unreachable"
    }

    return "unknown"
  } catch {
    try {
      await fetch(url, {
        method: "GET",
        mode: "no-cors",
        signal: controller.signal,
      })
      return "unknown"
    } catch {
      return "candidate"
    }
  } finally {
    window.clearTimeout(timeout)
  }
}

function dedupeByPageType(
  candidates: DiscoveredPageCandidate[]
): DiscoveredPageCandidate[] {
  const seen = new Set<AuditPageType>()
  const result: DiscoveredPageCandidate[] = []

  for (const candidate of candidates) {
    if (seen.has(candidate.pageType)) continue
    seen.add(candidate.pageType)
    result.push(candidate)
  }

  return result
}

/**
 * Discovers common public pages by probing known paths.
 * Reachability may be unknown when cross-origin policies block verification.
 */
export const candidatePageDiscoveryProvider: PageDiscoveryProvider = {
  async discover(baseUrl: string): Promise<DiscoveredPageCandidate[]> {
    const candidates: DiscoveredPageCandidate[] = []

    for (const definition of COMMON_PAGE_DEFINITIONS) {
      for (const path of definition.paths) {
        const url = buildPageUrl(baseUrl, path)
        const discoveryStatus = await probePageReachability(url)

        candidates.push({
          pageType: definition.pageType,
          path,
          url,
          discoveryStatus,
        })

        if (discoveryStatus === "reachable") {
          break
        }
      }
    }

    return dedupeByPageType(candidates)
  },
}

export async function discoverPages(
  baseUrl: string,
  provider: PageDiscoveryProvider = candidatePageDiscoveryProvider
): Promise<DiscoveredPageCandidate[]> {
  return provider.discover(baseUrl)
}

export { buildPageUrl }
