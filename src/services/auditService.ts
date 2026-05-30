import {
  aiRecommendations,
  dashboardMetrics,
  opportunityQueue,
} from "@/features/dashboard/data/mockData"
import { getRecommendationPlaybook as resolvePlaybook } from "@/features/audits/data/auditPlaybooks"
import { delay } from "@/services/internal/delay"
import * as auditDetailRepository from "@/services/internal/auditDetailRepository"
import * as auditListRepository from "@/services/internal/auditListRepository"
import type { Audit, AuditDetail, CreateAuditInput, Recommendation } from "@/types/audit"
import type { DashboardMetric, OpportunityItem } from "@/types/dashboard"
import type { RecommendationPlaybook } from "@/types/audit"

export async function getAudits(): Promise<Audit[]> {
  await delay()
  return auditListRepository.getAllAudits()
}

export async function getAuditById(id: string): Promise<Audit | null> {
  await delay()
  return auditListRepository.getAuditById(id) ?? null
}

export async function getAuditDetail(id: string): Promise<AuditDetail | null> {
  await delay()
  const summary = auditListRepository.getAuditById(id)
  return auditDetailRepository.getAuditDetail(
    id,
    summary ? { name: summary.name, domain: summary.domain } : undefined
  )
}

export const SAMPLE_AUDIT_ID = "audit-1"

export async function getSampleAuditDetail(): Promise<AuditDetail | null> {
  return getAuditDetail(SAMPLE_AUDIT_ID)
}

export async function createAudit(input: CreateAuditInput): Promise<Audit> {
  await delay(120)
  const audit = auditListRepository.createAuditFromUrl(input.url)
  auditDetailRepository.createAuditDetail(audit.id, audit.name, audit.domain)
  return audit
}

export async function updateAudit(
  id: string,
  patch: Partial<Audit>
): Promise<Audit | null> {
  await delay()
  return auditListRepository.updateAudit(id, patch)
}

export async function hasUserAudits(): Promise<boolean> {
  await delay()
  return auditListRepository.hasUserAudits()
}

export async function isValidAuditUrl(url: string): Promise<boolean> {
  await delay(0)
  return auditListRepository.isValidAuditUrl(url)
}

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  await delay()
  return dashboardMetrics
}

export async function getOpportunityQueue(): Promise<OpportunityItem[]> {
  await delay()
  return opportunityQueue
}

export async function getDashboardRecommendations(): Promise<Recommendation[]> {
  await delay()
  return aiRecommendations
}

export async function getRecommendationPlaybook(
  recommendationId: string
): Promise<RecommendationPlaybook> {
  await delay()
  return resolvePlaybook(recommendationId)
}
