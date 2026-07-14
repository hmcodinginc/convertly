import "./playwrightEnv.js"
import { chromium } from "playwright"
import { waitForDomStabilization } from "./domSettler.js"
import { extractFromPage, hashContent } from "./extractPageContent.js"
import { assertSafeUrl } from "./urlSafety.js"
import { PLAYWRIGHT_BROWSERS_DIR } from "./playwrightEnv.js"

const RENDER_SETTLE_MAX_MS = 8_000
const MAX_HTML_CHARS = 4_000_000

const BLOCKED_RESOURCE_TYPES = new Set(["image", "media", "font"])
const BLOCKED_URL_PATTERN =
  /google-analytics|googletagmanager|doubleclick|facebook\.net|hotjar|clarity\.ms|segment\.io|sentry\.io/i

/** networkidle removed — heavy SPAs (ASUS, streaming sites) never reach idle. */
const NAVIGATION_STRATEGIES = [
  { name: "domcontentloaded", waitUntil: "domcontentloaded", timeout: 25_000 },
  { name: "load", waitUntil: "load", timeout: 20_000 },
]

function classifyPlaywrightError(message) {
  const lower = message.toLowerCase()
  return {
    blockedByCloudflare: /cloudflare|cf-ray|challenge/i.test(lower),
    blockedByBotProtection: /bot|captcha|access denied|forbidden/i.test(lower),
    timedOut: /timeout|timed out/i.test(lower),
    redirectLoop: /too many redirects|err_too_many_redirects|redirect loop/i.test(lower),
    browserError: /browser launch|executable doesn't exist|target closed/i.test(lower),
    endlessNetwork:
      /networkidle|network idle|waiting for navigation/i.test(lower) ||
      lower.includes("render request timed out"),
  }
}

function buildAcquisitionDiagnostics(targetUrl, input = {}) {
  return {
    url: targetUrl,
    crawlStage: input.crawlStage ?? "playwright_render",
    crawlError: input.crawlError,
    httpStatus: input.httpStatus,
    redirectCount: input.redirectCount ?? 0,
    renderTimeMs: input.renderTimeMs,
    browserError: input.browserError,
    playwrightError: input.playwrightError,
    retryAttempts: input.retryAttempts ?? 0,
    blockedByCloudflare: input.blockedByCloudflare ?? false,
    blockedByBotProtection: input.blockedByBotProtection ?? false,
    timedOut: input.timedOut ?? false,
    javascriptExecuted: input.javascriptExecuted ?? false,
    pageAcquired: input.pageAcquired ?? false,
    renderCompleted: input.renderCompleted ?? false,
    contentSource: "rendered",
    navigationStrategy: input.navigationStrategy,
  }
}

function buildLaunchErrorResponse(targetUrl, error) {
  const message = error instanceof Error ? error.message : "Browser launch failed"
  let executablePath = "unknown"

  try {
    executablePath = chromium.executablePath()
  } catch {
    executablePath = "unresolved"
  }

  console.error(
    `[render-worker] Browser launch failure for ${targetUrl}: ${message} (executable=${executablePath}, browsersPath=${PLAYWRIGHT_BROWSERS_DIR})`
  )

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
    acquisitionDiagnostics: buildAcquisitionDiagnostics(targetUrl, {
      crawlStage: "playwright_launch",
      crawlError: message,
      browserError: message,
      playwrightError: message,
      retryAttempts: 0,
    }),
  }
}

async function launchBrowser() {
  return chromium.launch({ headless: true })
}

async function installResourceBlocking(page) {
  await page.route("**/*", (route) => {
    const request = route.request()
    const resourceType = request.resourceType()
    const url = request.url()

    if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
      return route.abort()
    }

    if (BLOCKED_URL_PATTERN.test(url)) {
      return route.abort()
    }

    return route.continue()
  })
}

async function hasMeaningfulContent(page) {
  try {
    return await page.evaluate(() => {
      const text = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim()
      const links = document.querySelectorAll("a[href]").length
      return text.length > 120 || links >= 2
    })
  } catch {
    return false
  }
}

async function collectPageDiagnostics(page, settle) {
  return page.evaluate(() => {
    const visibleText = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim()

    return {
      pathname: window.location.pathname,
      readyState: document.readyState,
      domLength: document.documentElement.outerHTML.length,
      visibleTextLength: visibleText.length,
      headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
      formCount: document.querySelectorAll("form").length,
      buttonCount: document.querySelectorAll("button, [role='button']").length,
      linkCount: document.querySelectorAll("a[href]").length,
      firstH1:
        document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
      documentTitle: document.title,
      openGraphTitle:
        document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ??
        null,
    }
  }).then((browserMetrics) => ({
    ...browserMetrics,
    domSettleMs: settle.domSettleMs,
    hydrationSettled: settle.hydrationSettled,
  }))
}

async function navigateWithStrategies(page, targetUrl) {
  let lastError = null

  for (const strategy of NAVIGATION_STRATEGIES) {
    try {
      const response = await page.goto(targetUrl, {
        waitUntil: strategy.waitUntil,
        timeout: strategy.timeout,
      })

      return {
        response,
        navigationStrategy: strategy.name,
        retryAttempts: 0,
      }
    } catch (error) {
      lastError = error

      if (await hasMeaningfulContent(page)) {
        return {
          response: null,
          navigationStrategy: `${strategy.name}-partial`,
          retryAttempts: 0,
        }
      }
    }
  }

  throw lastError ?? new Error("Navigation failed after exhausting strategies")
}

function buildSpaNetworkDiagnostic(targetUrl, renderTimeMs) {
  const message =
    "JavaScript rendering did not complete — the site kept active network activity (common on large SPAs with analytics or live content)."

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
    acquisitionDiagnostics: buildAcquisitionDiagnostics(targetUrl, {
      crawlStage: "playwright_navigation",
      crawlError: message,
      renderTimeMs,
      playwrightError: message,
      retryAttempts: 0,
      timedOut: true,
      javascriptExecuted: false,
      pageAcquired: false,
      renderCompleted: false,
      navigationStrategy: "domcontentloaded",
    }),
  }
}

export async function renderPage(url) {
  const safeUrl = assertSafeUrl(url)
  const targetUrl = safeUrl.toString()
  const renderStarted = Date.now()

  let browser
  try {
    browser = await launchBrowser()
  } catch (error) {
    return buildLaunchErrorResponse(targetUrl, error)
  }

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ConvertlyAuditBot/1.0",
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await installResourceBlocking(page)

    const { response, navigationStrategy, retryAttempts } = await navigateWithStrategies(
      page,
      targetUrl
    )

    const settle = await waitForDomStabilization(page, RENDER_SETTLE_MAX_MS)

    const htmlRaw = await page.content()
    const html = htmlRaw.length > MAX_HTML_CHARS ? htmlRaw.slice(0, MAX_HTML_CHARS) : htmlRaw
    const title = await page.title()
    const extracted = await extractFromPage(page, page.url())
    const contentHash = hashContent(html)
    const diagnostics = await collectPageDiagnostics(page, settle)
    const renderTimeMs = Date.now() - renderStarted
    const redirectCount = response?.url() && response.url() !== targetUrl ? 1 : 0

    if (diagnostics.visibleTextLength < 80 && diagnostics.linkCount < 2) {
      return buildSpaNetworkDiagnostic(page.url(), renderTimeMs)
    }

    return {
      ok: true,
      finalUrl: page.url(),
      html,
      text: extracted.text,
      title,
      links: extracted.links,
      headings: extracted.headings,
      contentHash,
      diagnostics,
      rendered: true,
      acquisitionDiagnostics: buildAcquisitionDiagnostics(page.url(), {
        crawlStage: "completed",
        httpStatus: response?.status(),
        redirectCount,
        renderTimeMs,
        retryAttempts,
        javascriptExecuted: true,
        pageAcquired: true,
        renderCompleted: true,
        navigationStrategy,
      }),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed"
    const classified = classifyPlaywrightError(message)
    const renderTimeMs = Date.now() - renderStarted

    if (classified.timedOut || classified.endlessNetwork) {
      return buildSpaNetworkDiagnostic(targetUrl, renderTimeMs)
    }

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
      acquisitionDiagnostics: buildAcquisitionDiagnostics(targetUrl, {
        crawlStage: classified.blockedByCloudflare
          ? "cloudflare"
          : classified.blockedByBotProtection
            ? "bot_protection"
            : classified.redirectLoop
              ? "redirect"
              : classified.timedOut
                ? "playwright_navigation"
                : "playwright_render",
        crawlError: message,
        renderTimeMs,
        playwrightError: message,
        browserError: classified.browserError ? message : undefined,
        retryAttempts: 0,
        ...classified,
        javascriptExecuted: false,
        pageAcquired: false,
        renderCompleted: false,
      }),
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
