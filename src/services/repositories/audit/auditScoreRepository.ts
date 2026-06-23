import type { AuditScore, AuditScoreCategory } from "@/types/auditEngine"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

function loadScores(): AuditScore[] {
  return getJson<AuditScore[]>(STORAGE_KEYS.auditScores, [])
}

function saveScores(scores: AuditScore[]): void {
  setJson(STORAGE_KEYS.auditScores, scores)
}

function createScore(score: AuditScore): AuditScore {
  const scores = loadScores()
  saveScores([score, ...scores])
  return score
}

function createScores(newScores: AuditScore[]): AuditScore[] {
  const scores = loadScores()
  saveScores([...newScores, ...scores])
  return newScores
}

function getScoresByAuditId(auditId: string): AuditScore[] {
  return loadScores().filter((score) => score.auditId === auditId)
}

function getScoreByCategory(
  auditId: string,
  category: AuditScoreCategory
): AuditScore | null {
  return getScoresByAuditId(auditId).find((score) => score.category === category) ?? null
}

function updateScore(id: string, patch: Partial<AuditScore>): AuditScore | null {
  const scores = loadScores()
  const index = scores.findIndex((score) => score.id === id)
  if (index === -1) return null

  const updated: AuditScore = {
    ...scores[index]!,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  scores[index] = updated
  saveScores(scores)
  return updated
}

export {
  createScore,
  createScores,
  getScoreByCategory,
  getScoresByAuditId,
  updateScore,
}
