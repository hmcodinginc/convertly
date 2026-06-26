import type { AuditPageType } from "@/types/auditEngine"

export type PageImportanceTier =
  | "highest"
  | "very_high"
  | "high"
  | "medium"
  | "lower"
  | "low"

export const PAGE_IMPORTANCE_WEIGHT: Record<PageImportanceTier, number> = {
  highest: 1,
  very_high: 0.92,
  high: 0.82,
  medium: 0.65,
  lower: 0.45,
  low: 0.3,
}

const PAGE_TYPE_IMPORTANCE: Record<AuditPageType, PageImportanceTier> = {
  homepage: "highest",
  pricing: "very_high",
  contact: "high",
  services: "high",
  features: "high",
  signup: "high",
  about: "medium",
  login: "medium",
  custom: "medium",
}

const PATH_IMPORTANCE_OVERRIDES: Array<{ pattern: RegExp; tier: PageImportanceTier }> = [
  { pattern: /\/(product|products)(\/|$)/i, tier: "high" },
  { pattern: /\/(case-stud|portfolio|work|projects)(\/|$)/i, tier: "medium" },
  { pattern: /\/(blog|news|articles)(\/|$)/i, tier: "lower" },
  { pattern: /\/(privacy|terms|legal|cookie)(\/|$)/i, tier: "low" },
]

export function resolvePageImportanceTier(
  pageType: AuditPageType,
  path: string
): PageImportanceTier {
  for (const override of PATH_IMPORTANCE_OVERRIDES) {
    if (override.pattern.test(path)) return override.tier
  }
  return PAGE_TYPE_IMPORTANCE[pageType] ?? "medium"
}

export function getPageImportanceWeight(pageType: AuditPageType, path: string): number {
  const tier = resolvePageImportanceTier(pageType, path)
  return PAGE_IMPORTANCE_WEIGHT[tier]
}

export function getPageImportanceLabel(tier: PageImportanceTier): string {
  return tier.replace("_", " ")
}
