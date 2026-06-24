import { chromium } from "playwright"
import { waitForDomStabilization } from "./domSettler.js"
import { extractFromPage, hashContent } from "./extractPageContent.js"
import { assertSafeUrl } from "./urlSafety.js"

const NAVIGATION_TIMEOUT_MS = 30_000
const RENDER_SETTLE_MAX_MS = 8_000

export async function renderPage(url) {
  const safeUrl = assertSafeUrl(url)
  const targetUrl = safeUrl.toString()

  console.info(`[PLAYWRIGHT] Browser launched url=${targetUrl}`)

  const browser = await chromium.launch({ headless: true })

  try {
    const context = await browser.newContext({
      userAgent: "ConvertlyAuditBot/1.0",
    })
    const page = await context.newPage()

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    })

    const settleMs = await waitForDomStabilization(page, RENDER_SETTLE_MAX_MS)
    console.info(`[PLAYWRIGHT] DOM stabilized url=${page.url()} ms=${settleMs}`)

    const html = await page.content()
    const title = await page.title()
    const extracted = await extractFromPage(page, page.url())
    const contentHash = hashContent(html)

    console.info(`[PLAYWRIGHT] Extracted links url=${page.url()} count=${extracted.links.length}`)

    return {
      ok: true,
      finalUrl: page.url(),
      html,
      text: extracted.text,
      title,
      links: extracted.links,
      headings: extracted.headings,
      contentHash,
      rendered: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed"
    console.info(`[PLAYWRIGHT] Render failed url=${targetUrl} error=${message}`)

    return {
      ok: false,
      finalUrl: targetUrl,
      html: null,
      text: null,
      title: null,
      links: [],
      headings: { h1: [], h2: [] },
      contentHash: null,
      rendered: true,
      error: message,
    }
  } finally {
    await browser.close()
  }
}
