import fs from "node:fs"
import { chromium } from "playwright"
import { createRequire } from "node:module"
import { PLAYWRIGHT_BROWSERS_DIR } from "./playwrightEnv.js"

const require = createRequire(import.meta.url)

function log(message, fields = {}) {
  const suffix = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")
  console.info(`[PLAYWRIGHT] ${message}${suffix ? ` ${suffix}` : ""}`)
}

function readPlaywrightVersion() {
  try {
    const pkg = require("playwright/package.json")
    return pkg.version
  } catch {
    return "unknown"
  }
}

function resolveExecutablePath() {
  try {
    return chromium.executablePath()
  } catch (error) {
    const message = error instanceof Error ? error.message : "executablePath failed"
    return { error: message }
  }
}

export async function runBrowserStartupDiagnostics() {
  const version = readPlaywrightVersion()
  const executable = resolveExecutablePath()

  log("Startup diagnostics", {
    playwrightVersion: version,
    browsersPath: PLAYWRIGHT_BROWSERS_DIR,
    browsersPathExists: fs.existsSync(PLAYWRIGHT_BROWSERS_DIR),
    nodeEnv: process.env.NODE_ENV ?? "unset",
  })

  if (typeof executable === "object" && executable.error) {
    log("Browser executable missing", {
      error: executable.error,
      hint: "Run npm run build:browsers during Render build",
    })
    return { ok: false, version, executablePath: null, error: executable.error }
  }

  const executableExists = fs.existsSync(executable)
  log("Browser executable resolved", {
    path: executable,
    exists: executableExists,
  })

  if (!executableExists) {
    const error = `Executable not found at ${executable}`
    log("Browser launch skipped", { error })
    return { ok: false, version, executablePath: executable, error }
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    log("Browser launch success", { executablePath: executable })
    return { ok: true, version, executablePath: executable, error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser launch failed"
    log("Browser launch failure", {
      executablePath: executable,
      error: message,
    })
    return { ok: false, version, executablePath: executable, error: message }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
