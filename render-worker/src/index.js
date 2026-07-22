import "./playwrightEnv.js"
import http from "node:http"
import { runBrowserStartupDiagnostics } from "./browserDiagnostics.js"
import { renderPage } from "./playwrightRenderer.js"
import { assertSafeUrl } from "./urlSafety.js"

const PORT = Number(process.env.PORT ?? 3100)
const REQUEST_TIMEOUT_MS = 50_000

// Shared secret required on POST /render. When unset (local development),
// requests are accepted without a token — never leave it unset in production.
const RENDER_WORKER_TOKEN = process.env.RENDER_WORKER_TOKEN?.trim() || null

function isAuthorized(req) {
  if (!RENDER_WORKER_TOKEN) return true
  const provided = req.headers["x-render-token"]
  return typeof provided === "string" && provided === RENDER_WORKER_TOKEN
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  if (!raw) return {}
  return JSON.parse(raw)
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Render request timed out")), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, authorization, x-render-token",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    })
    res.end()
    return
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true, service: "convertly-render-worker" })
    return
  }

  if (req.method !== "POST" || req.url !== "/render") {
    sendJson(res, 404, { error: "Not found" })
    return
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: "Unauthorized" })
    return
  }

  try {
    const body = await readBody(req)
    if (!body.url?.trim()) {
      sendJson(res, 400, { error: "URL is required" })
      return
    }

    assertSafeUrl(body.url.trim())
    const result = await withTimeout(renderPage(body.url.trim()), REQUEST_TIMEOUT_MS)
    sendJson(res, 200, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    sendJson(res, 200, {
      ok: false,
      finalUrl: "",
      html: null,
      text: null,
      title: null,
      links: [],
      headings: { h1: [], h2: [] },
      contentHash: null,
      rendered: true,
      error: message,
    })
  }
})

server.listen(PORT, async () => {
  console.info(`[render-worker] Listening on port ${PORT}`)
  if (!RENDER_WORKER_TOKEN) {
    console.warn(
      "[render-worker] RENDER_WORKER_TOKEN is not set — /render is unauthenticated. Set it in production."
    )
  }
  const diagnostics = await runBrowserStartupDiagnostics()
  if (!diagnostics.ok) {
    console.error(`[render-worker] Startup diagnostics failed: ${diagnostics.error}`)
  }
})
