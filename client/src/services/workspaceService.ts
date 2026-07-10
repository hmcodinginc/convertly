import {
  formatPlanPrice,
  getEffectivePlanEntitlement,
  type EffectivePlanId,
} from "@/lib/billingPlans"
import { assertBusinessFoundationEnabled, isBusinessFoundationEnabled } from "@/lib/businessFoundation"
import { ensureBusinessFoundation } from "@/services/businessBootstrapService"
import {
  buildPlanUsage,
  resolvePlanForUser,
} from "@/services/planResolutionService"
import * as domainRepository from "@/services/repositories/business/domainRepository"
import * as workspaceRepository from "@/services/repositories/business/workspaceRepository"
import type {
  CreateDomainInput,
  UpdateDomainInput,
  WorkspaceDomain,
  WorkspaceSnapshot,
} from "@/types/workspace"

function mapDomain(row: Awaited<ReturnType<typeof domainRepository.listDomains>>[number]): WorkspaceDomain {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    hostname: row.hostname,
    isPrimary: row.is_primary,
    lastAuditedAt: row.last_audited_at,
    createdAt: row.created_at,
  }
}

function formatLastAudited(value: string | null): string {
  if (!value) return "Never"
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export async function getWorkspace(userId: string): Promise<WorkspaceSnapshot> {
  assertBusinessFoundationEnabled()
  const workspaceId = await ensureBusinessFoundation(userId)

  const [workspace, domains, subscription] = await Promise.all([
    workspaceRepository.getPersonalWorkspace(userId),
    domainRepository.listDomains(workspaceId),
    workspaceRepository.getSubscriptionByWorkspaceId(workspaceId),
  ])

  if (!workspace || !subscription) {
    throw new Error("Workspace data is unavailable.")
  }

  const resolved = await resolvePlanForUser(userId)
  const usage = buildPlanUsage(subscription, resolved)

  return {
    id: workspace.id,
    name: workspace.name,
    type: workspace.type,
    domains: domains.map(mapDomain),
    usage: {
      planId: usage.effectivePlanId,
      planName: usage.planName,
      auditsUsed: usage.auditsUsed,
      auditsIncluded: usage.auditsIncluded,
      auditsRemaining: usage.auditsRemaining,
      period: usage.period,
      periodEnd: usage.periodEnd,
    },
  }
}

export { formatLastAudited }

export async function addDomain(
  userId: string,
  input: CreateDomainInput
): Promise<WorkspaceDomain> {
  const workspaceId = await ensureBusinessFoundation(userId)
  const row = await domainRepository.createDomain(workspaceId, input)
  return mapDomain(row)
}

export async function updateDomain(
  userId: string,
  domainId: string,
  input: UpdateDomainInput
): Promise<WorkspaceDomain> {
  const workspaceId = await ensureBusinessFoundation(userId)
  const row = await domainRepository.updateDomain(domainId, workspaceId, input)
  return mapDomain(row)
}

export async function removeDomain(userId: string, domainId: string): Promise<void> {
  const workspaceId = await ensureBusinessFoundation(userId)
  await domainRepository.deleteDomain(domainId, workspaceId)
}

export async function renameWorkspace(userId: string, name: string): Promise<void> {
  const workspaceId = await ensureBusinessFoundation(userId)
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Workspace name is required.")
  await workspaceRepository.updateWorkspaceName(workspaceId, trimmed)
}

export async function recordAuditForDomain(
  userId: string,
  websiteUrl: string
): Promise<void> {
  if (!isBusinessFoundationEnabled()) return
  try {
    const workspaceId = await ensureBusinessFoundation(userId)
    await domainRepository.touchDomainLastAudited(workspaceId, websiteUrl)
  } catch {
    /* non-blocking */
  }
}

export function getWorkspacePlanSummary(planId: EffectivePlanId): string {
  const plan = getEffectivePlanEntitlement(planId)
  if (plan.period === "lifetime") {
    return `${plan.name} · ${plan.auditsPerPeriod} lifetime audits`
  }
  if (planId === "internal") {
    return `${plan.name} · ${plan.auditsPerPeriod} audits/mo`
  }
  return `${plan.name} · ${formatPlanPrice(planId)}/mo · ${plan.auditsPerPeriod} audits/mo`
}
