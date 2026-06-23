import type { AuditFinding } from "@/types/auditEngine"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

function loadFindings(): AuditFinding[] {
  return getJson<AuditFinding[]>(STORAGE_KEYS.auditFindings, [])
}

function saveFindings(findings: AuditFinding[]): void {
  setJson(STORAGE_KEYS.auditFindings, findings)
}

function createFinding(finding: AuditFinding): AuditFinding {
  const findings = loadFindings()
  saveFindings([finding, ...findings])
  return finding
}

function createFindings(newFindings: AuditFinding[]): AuditFinding[] {
  const findings = loadFindings()
  saveFindings([...newFindings, ...findings])
  return newFindings
}

function getFindingsByAuditId(auditId: string): AuditFinding[] {
  return loadFindings()
    .filter((finding) => finding.auditId === auditId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export { createFinding, createFindings, getFindingsByAuditId }
