import { renderPage } from "../src/playwrightRenderer.js"

const URLS = [
  "https://hmcoding.com/",
  "https://hmcoding.com/about",
  "https://hmcoding.com/projects",
  "https://hmcoding.com/projects/inventory-system",
  "https://hmcoding.com/projects/real-estate-crm",
]

const results = []

for (const url of URLS) {
  const result = await renderPage(url)
  const d = result.diagnostics ?? {}
  results.push({
    url,
    ok: result.ok,
    finalUrl: result.finalUrl,
    pathname: d.pathname,
    title: d.documentTitle ?? result.title,
    h1: d.firstH1 ?? result.headings?.h1?.[0] ?? null,
    domLength: d.domLength ?? result.html?.length ?? 0,
    visibleText: d.visibleTextLength ?? result.text?.length ?? 0,
    hash: result.contentHash?.slice(0, 12),
    settled: d.hydrationSettled,
    readyState: d.readyState,
  })
}

console.log("\n=== HM Coding render evidence ===\n")
for (const row of results) {
  console.log(JSON.stringify(row, null, 2))
  console.log("---")
}

const hashes = new Map()
for (const row of results) {
  if (!row.hash) continue
  const existing = hashes.get(row.hash)
  if (existing) {
    console.warn(`DUPLICATE HASH: ${existing.url} === ${row.url}`)
  } else {
    hashes.set(row.hash, row)
  }
}
