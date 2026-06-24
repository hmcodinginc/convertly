import type { AuditPage } from "@/types/auditEngine"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { STORAGE_KEYS } from "@/services/storage/keys"

function loadPages(): AuditPage[] {
  return getJson<AuditPage[]>(STORAGE_KEYS.auditPages, [])
}

function savePages(pages: AuditPage[]): void {
  setJson(STORAGE_KEYS.auditPages, pages)
}

function createPage(page: AuditPage): AuditPage {
  const pages = loadPages()
  savePages([page, ...pages])
  return page
}

function createPages(newPages: AuditPage[]): AuditPage[] {
  const pages = loadPages()
  savePages([...newPages, ...pages])
  return newPages
}

function getPagesByAuditId(auditId: string): AuditPage[] {
  return loadPages()
    .filter((page) => page.auditId === auditId)
    .sort((a, b) => a.discoveredAt.localeCompare(b.discoveredAt))
}

function getPageById(id: string): AuditPage | null {
  return loadPages().find((page) => page.id === id) ?? null
}

function updatePage(id: string, patch: Partial<AuditPage>): AuditPage | null {
  const pages = loadPages()
  const index = pages.findIndex((page) => page.id === id)
  if (index === -1) return null

  const updated = { ...pages[index]!, ...patch }
  pages[index] = updated
  savePages(pages)
  return updated
}

export { createPage, createPages, getPageById, getPagesByAuditId, updatePage }
