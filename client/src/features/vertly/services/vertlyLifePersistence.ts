import type { VertlyMilestoneId } from "@/features/vertly/types"
import { getJson, setJson } from "@/services/storage/localStorageClient"
import { getJson as getSessionJson, setJson as setSessionJson } from "@/services/storage/sessionStorageClient"

const MILESTONE_PREFIX = "convertly:vertly:milestone:"
const LIFE_MOMENT_DISMISS_PREFIX = "convertly:vertly:life-moment:"
const SESSION_HELP_SHOWN_KEY = "convertly:vertly:help-shown"
const SESSION_AUDIT_BUBBLE_PREFIX = "convertly:vertly:audit-bubble:"

function milestoneKey(userKey: string, id: VertlyMilestoneId): string {
  return `${MILESTONE_PREFIX}${userKey}:${id}`
}

function lifeMomentKey(userKey: string, momentId: string): string {
  return `${LIFE_MOMENT_DISMISS_PREFIX}${userKey}:${momentId}`
}

export function hasVertlyMilestone(userKey: string, id: VertlyMilestoneId): boolean {
  return getJson<boolean>(milestoneKey(userKey, id), false)
}

export function markVertlyMilestone(userKey: string, id: VertlyMilestoneId): void {
  setJson(milestoneKey(userKey, id), true)
}

export function isVertlyLifeMomentDismissed(userKey: string, momentId: string): boolean {
  return getJson<boolean>(lifeMomentKey(userKey, momentId), false)
}

export function dismissVertlyLifeMoment(userKey: string, momentId: string): void {
  setJson(lifeMomentKey(userKey, momentId), true)
}

export function hasShownSessionHelpBubble(): boolean {
  return getSessionJson<boolean>(SESSION_HELP_SHOWN_KEY, false)
}

export function markSessionHelpBubbleShown(): void {
  setSessionJson(SESSION_HELP_SHOWN_KEY, true)
}

export function hasShownAuditFinishedBubble(auditId: string): boolean {
  return getSessionJson<boolean>(`${SESSION_AUDIT_BUBBLE_PREFIX}${auditId}`, false)
}

export function markAuditFinishedBubbleShown(auditId: string): void {
  setSessionJson(`${SESSION_AUDIT_BUBBLE_PREFIX}${auditId}`, true)
}
