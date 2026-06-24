import type {
  AuditPage,
  AuditSession,
  AuditSessionData,
  AuditSessionStatus,
} from "@/types/auditEngine"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

function loadSessions(): AuditSession[] {
  return getJson<AuditSession[]>(STORAGE_KEYS.auditSessions, [])
}

function saveSessions(sessions: AuditSession[]): void {
  setJson(STORAGE_KEYS.auditSessions, sessions)
}

function createId(): string {
  return crypto.randomUUID()
}

function createSession(userId: string, websiteUrl: string): AuditSession {
  const now = new Date().toISOString()
  const session: AuditSession = {
    id: createId(),
    userId,
    websiteUrl,
    createdAt: now,
    updatedAt: now,
    status: "pending",
  }

  const sessions = loadSessions()
  saveSessions([session, ...sessions])
  return session
}

function getSessionById(id: string): AuditSession | null {
  return loadSessions().find((session) => session.id === id) ?? null
}

function getSessionsByUserId(userId: string): AuditSession[] {
  return loadSessions().filter((session) => session.userId === userId)
}

function updateSessionStatus(
  id: string,
  status: AuditSessionStatus,
  errorMessage?: string
): AuditSession | null {
  const sessions = loadSessions()
  const index = sessions.findIndex((session) => session.id === id)
  if (index === -1) return null

  const updated: AuditSession = {
    ...sessions[index]!,
    status,
    updatedAt: new Date().toISOString(),
    errorMessage: errorMessage ?? sessions[index]!.errorMessage,
  }

  sessions[index] = updated
  saveSessions(sessions)
  return updated
}

function touchSession(id: string): AuditSession | null {
  const sessions = loadSessions()
  const index = sessions.findIndex((session) => session.id === id)
  if (index === -1) return null

  const updated: AuditSession = {
    ...sessions[index]!,
    updatedAt: new Date().toISOString(),
  }

  sessions[index] = updated
  saveSessions(sessions)
  return updated
}

export {
  createSession,
  getSessionById,
  getSessionsByUserId,
  touchSession,
  updateSessionStatus,
}

export type { AuditPage, AuditSession, AuditSessionData }
