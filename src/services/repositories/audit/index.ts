import * as auditProvider from "@/services/repositories/audit/provider"

export {
  createFindings,
  createHistoryEvent,
  createPages,
  createScores,
  createSession,
  deleteAudit,
  getAuditSessionData,
  getFindingsByAuditId,
  getFindingsByUserId,
  getHistoryByAuditId,
  getPagesByAuditId,
  getScoresByAuditId,
  getSessionById,
  getSessionsByUserId,
  updateSessionStatus,
  upsertScores,
} from "@/services/repositories/audit/provider"

/** @deprecated Use provider functions directly */
export const auditSessionRepository = {
  createSession: auditProvider.createSession,
  getSessionById: auditProvider.getSessionById,
  getSessionsByUserId: auditProvider.getSessionsByUserId,
  updateSessionStatus: auditProvider.updateSessionStatus,
}

export const auditPageRepository = {
  createPages: auditProvider.createPages,
  getPagesByAuditId: auditProvider.getPagesByAuditId,
}

export const auditFindingRepository = {
  createFindings: auditProvider.createFindings,
  getFindingsByAuditId: auditProvider.getFindingsByAuditId,
}

export const auditScoreRepository = {
  createScores: auditProvider.createScores,
  upsertScores: auditProvider.upsertScores,
  getScoresByAuditId: auditProvider.getScoresByAuditId,
}

export const auditHistoryRepository = {
  createHistoryEvent: auditProvider.createHistoryEvent,
  getHistoryByAuditId: auditProvider.getHistoryByAuditId,
}
