import http from "node:http"
import { renderPage } from "./playwrightRenderer.js"
import { assertSafeUrl } from "./urlSafety.js"

const PORT = Number(process.env.PORT ?? 3100)

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

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    })
    res.end()
    return
  }

  if (req.method !== "POST" || req.url !== "/render") {
    sendJson(res, 404, { error: "Not found" })
    return
  }

  try {
    const body = await readBody(req)
    if (!body.url?.trim()) {
      sendJson(res, 400, { error: "URL is required" })
      return
    }

    assertSafeUrl(body.url.trim())
    const result = await renderPage(body.url.trim())
    sendJson(res, 200, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    sendJson(res, 400, { error: message })
  }
})

server.listen(PORT, () => {
  console.info(`[PLAYWRIGHT] Render worker listening on port ${PORT}`)
})
