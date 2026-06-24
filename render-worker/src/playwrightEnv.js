import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/** Browsers live inside the deploy slug so Render build output includes Chromium. */
export const PLAYWRIGHT_BROWSERS_DIR =
  process.env.PLAYWRIGHT_BROWSERS_PATH?.trim() ||
  path.join(packageRoot, "browsers")

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = PLAYWRIGHT_BROWSERS_DIR
}

export function ensureBrowsersDirectory() {
  if (!fs.existsSync(PLAYWRIGHT_BROWSERS_DIR)) {
    fs.mkdirSync(PLAYWRIGHT_BROWSERS_DIR, { recursive: true })
  }
}
