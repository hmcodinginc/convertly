import * as bootstrapRepository from "@/services/repositories/business/bootstrapRepository"
import { assertBusinessFoundationEnabled } from "@/lib/businessFoundation"

const inflightByUser = new Map<string, Promise<string>>()

export async function ensureBusinessFoundation(userId: string): Promise<string> {
  assertBusinessFoundationEnabled()

  const existing = await bootstrapRepository.getPersonalWorkspaceId(userId)
  if (existing) return existing

  const inflight = inflightByUser.get(userId)
  if (inflight) return inflight

  const task = bootstrapRepository.bootstrapBusinessFoundation().finally(() => {
    inflightByUser.delete(userId)
  })

  inflightByUser.set(userId, task)
  return task
}

export async function resolvePersonalWorkspaceId(userId: string): Promise<string> {
  await ensureBusinessFoundation(userId)
  const workspaceId = await bootstrapRepository.getPersonalWorkspaceId(userId)
  if (!workspaceId) {
    throw new Error("Personal workspace not found.")
  }
  return workspaceId
}
