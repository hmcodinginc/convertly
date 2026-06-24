import {
  DESKTOP_VIEWPORT,
  MOBILE_VIEWPORT,
} from "@/services/audit/constants"
import type {
  AuditPage,
  ScreenshotReference,
  ScreenshotViewport,
} from "@/types/auditEngine"

function createScreenshotStorageKey(
  auditId: string,
  pageId: string,
  viewport: ScreenshotViewport
): string {
  return `audit-screenshots/${auditId}/${pageId}/${viewport}.png`
}

function createPlaceholderScreenshot(
  auditId: string,
  pageId: string,
  pageUrl: string,
  viewport: ScreenshotViewport
): ScreenshotReference {
  const dimensions = viewport === "desktop" ? DESKTOP_VIEWPORT : MOBILE_VIEWPORT

  return {
    viewport,
    storageKey: createScreenshotStorageKey(auditId, pageId, viewport),
    captureStatus: "placeholder",
    width: dimensions.width,
    height: dimensions.height,
    placeholderLabel: `${viewport} preview · ${pageUrl}`,
    capturedAt: new Date().toISOString(),
  }
}

export function attachScreenshotPlaceholders(page: AuditPage): AuditPage {
  return {
    ...page,
    screenshots: {
      desktop: createPlaceholderScreenshot(
        page.auditId,
        page.id,
        page.url,
        "desktop"
      ),
      mobile: createPlaceholderScreenshot(page.auditId, page.id, page.url, "mobile"),
    },
  }
}

export function attachScreenshotsToPages(pages: AuditPage[]): AuditPage[] {
  return pages.map(attachScreenshotPlaceholders)
}

/**
 * Future screenshot capture will replace placeholders with real captures.
 * This interface keeps the audit pipeline decoupled from the capture provider.
 */
export type ScreenshotCaptureProvider = {
  capture: (
    pageUrl: string,
    viewport: ScreenshotViewport
  ) => Promise<ScreenshotReference>
}

export const placeholderScreenshotProvider: ScreenshotCaptureProvider = {
  async capture(pageUrl, viewport) {
    return createPlaceholderScreenshot("pending", "pending", pageUrl, viewport)
  },
}
