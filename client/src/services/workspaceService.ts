import {
  workspaceAuditLimits,
  workspaceCompany,
  workspaceDomains,
  workspaceTeam,
} from "@/features/workspace/data/workspaceMockData"
import { delay } from "@/services/internal/delay"
import type { WorkspaceSnapshot } from "@/types/workspace"

export async function getWorkspace(): Promise<WorkspaceSnapshot> {
  await delay()
  return {
    company: workspaceCompany,
    domains: workspaceDomains,
    team: workspaceTeam,
    auditLimits: workspaceAuditLimits,
  }
}
