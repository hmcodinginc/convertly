const URLS = [
  "https://hmcoding.com/",
  "https://hmcoding.com/about",
  "https://hmcoding.com/projects",
  "https://hmcoding.com/projects/inventory-system",
  "https://hmcoding.com/projects/real-estate-crm",
]

function extractMetrics(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const ogMatch = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

  return {
    domLength: html.length,
    visibleTextLength: text.length,
    documentTitle: titleMatch?.[1]?.trim() ?? null,
    h1: h1Match?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null,
    ogTitle: ogMatch?.[1]?.trim() ?? null,
    preview: html.slice(0, 200),
  }
}

async function hash(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16)
}

const rows = []
for (const url of URLS) {
  const res = await fetch(url, { redirect: "follow" })
  const html = await res.text()
  const metrics = extractMetrics(html)
  rows.push({
    url,
    finalUrl: res.url,
    pathname: new URL(res.url).pathname,
    status: res.status,
    hash: await hash(html),
    ...metrics,
  })
}

console.log("\n=== HM Coding STATIC fetch evidence (simulates SPA shell) ===\n")
for (const row of rows) {
  console.log(JSON.stringify(row, null, 2))
  console.log("---")
}

const byHash = new Map()
for (const row of rows) {
  const existing = byHash.get(row.hash)
  if (existing) {
    console.warn(`DUPLICATE STATIC HTML: ${existing.url} === ${row.url}`)
  } else {
    byHash.set(row.hash, row)
  }
}
