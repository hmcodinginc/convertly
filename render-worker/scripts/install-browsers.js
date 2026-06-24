import { execSync } from "node:child_process"
import fs from "node:fs"
import {
  ensureBrowsersDirectory,
  PLAYWRIGHT_BROWSERS_DIR,
} from "../src/playwrightEnv.js"

function log(message, fields = {}) {
  const suffix = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")
  console.info(`[PLAYWRIGHT] ${message}${suffix ? ` ${suffix}` : ""}`)
}

if (process.env.SKIP_PLAYWRIGHT_BROWSER_DOWNLOAD === "1") {
  log("Skipping browser download", { reason: "SKIP_PLAYWRIGHT_BROWSER_DOWNLOAD=1" })
  process.exit(0)
}

ensureBrowsersDirectory()

log("Installing Chromium", {
  browsersPath: PLAYWRIGHT_BROWSERS_DIR,
  playwrightVersion: process.env.npm_package_dependencies_playwright ?? "unknown",
})

try {
  execSync("npx playwright install chromium", {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: PLAYWRIGHT_BROWSERS_DIR,
    },
  })
} catch (error) {
  const message = error instanceof Error ? error.message : "Browser install failed"
  console.error(`[PLAYWRIGHT] Chromium install failed error=${message}`)
  process.exit(1)
}

if (!fs.existsSync(PLAYWRIGHT_BROWSERS_DIR)) {
  console.error(
    `[PLAYWRIGHT] Chromium install finished but browsers path is missing path=${PLAYWRIGHT_BROWSERS_DIR}`
  )
  process.exit(1)
}

log("Chromium install complete", { browsersPath: PLAYWRIGHT_BROWSERS_DIR })
