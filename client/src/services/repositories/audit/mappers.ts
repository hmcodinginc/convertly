import type {
  AuditFinding,
  AuditHistoryEvent,
  AuditPage,
  AuditScore,
  AuditSession,
} from "@/types/auditEngine"
import type { Database } from "@/types/database"

type AuditRow = Database["public"]["Tables"]["audits"]["Row"]
type AuditPageRow = Database["public"]["Tables"]["audit_pages"]["Row"]
type AuditFindingRow = Database["public"]["Tables"]["audit_findings"]["Row"]
type AuditScoreRow = Database["public"]["Tables"]["audit_scores"]["Row"]
type AuditHistoryRow = Database["public"]["Tables"]["audit_history"]["Row"]

function emptyScreenshot(viewport: "desktop" | "mobile", storageKey: string | null) {
  return {
    viewport,
    storageKey: storageKey ?? "",
    captureStatus: storageKey ? ("placeholder" as const) : ("pending" as const),
    width: viewport === "desktop" ? 1440 : 390,
    height: viewport === "desktop" ? 900 : 844,
    placeholderLabel: storageKey ?? "",
  }
}

export function mapAuditRowToSession(row: AuditRow): AuditSession {
  return {
    id: row.id,
    userId: row.user_id,
    websiteUrl: row.website_url,
    auditType: row.audit_type ?? "full-funnel",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    errorMessage: row.error_message ?? undefined,
    workspaceId: row.workspace_id,
    entitlementConsumedAt: row.entitlement_consumed_at,
  }
}

export function mapPageRowToAuditPage(row: AuditPageRow): AuditPage {
  return {
    id: row.id,
    auditId: row.audit_id,
    pageType: row.page_type,
    url: row.url,
    path: row.path,
    title: row.title,
    discoveryStatus: row.discovery_status,
    discoveredAt: row.discovered_at,
    screenshots: {
      desktop: emptyScreenshot("desktop", row.desktop_screenshot_key),
      mobile: emptyScreenshot("mobile", row.mobile_screenshot_key),
    },
  }
}

export function mapFindingRowToFinding(row: AuditFindingRow): AuditFinding {
  return {
    id: row.id,
    auditId: row.audit_id,
    pageId: row.page_id ?? undefined,
    ruleId: row.rule_id ?? undefined,
    category: row.category,
    severity: row.severity,
    title: row.title,
    description: row.description,
    recommendation: row.recommendation,
    createdAt: row.created_at,
  }
}

export function mapScoreRowToScore(row: AuditScoreRow): AuditScore {
  return {
    id: row.id,
    auditId: row.audit_id,
    category: row.category,
    score: row.score != null ? Number(row.score) : null,
    maxScore: Number(row.max_score),
    label: row.label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapHistoryRowToEvent(row: AuditHistoryRow): AuditHistoryEvent {
  return {
    id: row.id,
    auditId: row.audit_id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
  }
}

export function auditPageToInsert(page: AuditPage): Database["public"]["Tables"]["audit_pages"]["Insert"] {
  return {
    id: page.id,
    audit_id: page.auditId,
    page_type: page.pageType,
    url: page.url,
    path: page.path,
    title: page.title,
    discovery_status: page.discoveryStatus,
    desktop_screenshot_key: page.screenshots.desktop.storageKey || null,
    mobile_screenshot_key: page.screenshots.mobile.storageKey || null,
    discovered_at: page.discoveredAt,
  }
}

export function auditFindingToInsert(
  finding: AuditFinding
): Database["public"]["Tables"]["audit_findings"]["Insert"] {
  return {
    id: finding.id,
    audit_id: finding.auditId,
    page_id: finding.pageId ?? null,
    rule_id: finding.ruleId ?? null,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    created_at: finding.createdAt,
  }
}

export function auditScoreToInsert(
  score: AuditScore
): Database["public"]["Tables"]["audit_scores"]["Insert"] {
  return {
    id: score.id,
    audit_id: score.auditId,
    category: score.category,
    score: score.score,
    max_score: score.maxScore,
    label: score.label,
    created_at: score.createdAt,
    updated_at: score.updatedAt,
  }
}
