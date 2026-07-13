const STORAGE_PREFIX = "convertly:pending-plan-banner-dismissed:"

export function isPendingPlanBannerDismissed(userId: string): boolean {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`) === "1"
  } catch {
    return false
  }
}

export function dismissPendingPlanBanner(userId: string): void {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, "1")
  } catch {
    // ignore storage failures
  }
}

export function clearPendingPlanBannerDismissal(userId: string): void {
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${userId}`)
  } catch {
    // ignore storage failures
  }
}
