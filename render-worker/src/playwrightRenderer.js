import "./playwrightEnv.js"
import { chromium } from "playwright"
import fs from "node:fs"
import { waitForDomStabilization } from "./domSettler.js"
import { extractFromPage, hashContent } from "./extractPageContent.js"
import { assertSafeUrl } from "./urlSafety.js"
import { PLAYWRIGHT_BROWSERS_DIR } from "./playwrightEnv.js"

const NAVIGATION_TIMEOUT_MS = 30_000
const RENDER_SETTLE_MAX_MS = 8_000

function log(message, fields = {}) {
  const suffix = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")
  console.info(`[PLAYWRIGHT] ${message}${suffix ? ` ${suffix}` : ""}`)
}

function buildLaunchErrorResponse(targetUrl, error) {
  const message = error instanceof Error ? error.message : "Browser launch failed"
  let executablePath = "unknown"

  try {
    executablePath = chromium.executablePath()
  } catch {
    executablePath = "unresolved"
  }

  log("Browser launch failure", {
    url: targetUrl,
    error: message,
    executablePath,
    browsersPath: PLAYWRIGHT_BROWSERS_DIR,
    executableExists:
      executablePath !== "unknown" &&
      executablePath !== "unresolved" &&
      fs.existsSync(executablePath),
  })

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
    error: `Browser launch failed: ${message}. executable=${executablePath} browsersPath=${PLAYWRIGHT_BROWSERS_DIR}`,
  }
}

async function launchBrowser(targetUrl) {
  const executablePath = chromium.executablePath()
  log("Launching browser", {
    url: targetUrl,
    executablePath,
    executableExists: fs.existsSync(executablePath),
    browsersPath: PLAYWRIGHT_BROWSERS_DIR,
  })

  const browser = await chromium.launch({ headless: true })
  log("Browser launched", { url: targetUrl, executablePath })
  return browser
}

export async function renderPage(url) {
  const safeUrl = assertSafeUrl(url)
  const targetUrl = safeUrl.toString()

  let browser
  try {
    browser = await launchBrowser(targetUrl)
  } catch (error) {
    return buildLaunchErrorResponse(targetUrl, error)
  }

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
    log("DOM stabilized", { url: page.url(), ms: settleMs })

    const html = await page.content()
    const title = await page.title()
    const extracted = await extractFromPage(page, page.url())
    const contentHash = hashContent(html)

    log("Extracted links", { url: page.url(), count: extracted.links.length })

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
    log("Render failed", { url: targetUrl, error: message })

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
    if (browser) {
      await browser.close()
    }
  }
}
