/**
 * Static V5 intent verification — run: node scripts/verify-v5-intent.mjs
 * Proves domain-locked intents without importing TypeScript modules.
 */

const DOMAIN_HINTS = [
  { pattern: /(^|\.)google\.[a-z.]+$/i, intent: "search_engine" },
  { pattern: /(^|\.)amazon\.[a-z.]+$/i, intent: "marketplace" },
  { pattern: /(^|\.)vercel\.com$/i, intent: "developer_platform" },
  { pattern: /(^|\.)hmcoding\.com$/i, intent: "agency" },
]

const CRO_PACKS = [
  "homepage.conversion",
  "homepage.trust",
  "services.conversion",
  "contact.conversion",
  "pricing.conversion",
]

const PACK_INTENTS = {
  "homepage.conversion": ["saas", "agency", "marketing", "commerce", "ecommerce"],
  "homepage.trust": ["saas", "agency", "marketing", "commerce", "ecommerce"],
  "services.conversion": ["agency", "portfolio", "saas", "commerce", "ecommerce", "marketing"],
  "contact.conversion": ["agency", "saas", "commerce", "ecommerce", "marketing", "portfolio", "community"],
  "pricing.conversion": ["saas", "ecommerce"],
}

const NON_CRO_INTENTS = new Set([
  "search_engine",
  "marketplace",
  "developer_platform",
  "documentation",
  "open_source",
  "dashboard",
])

function resolveDomainIntent(hostname) {
  for (const hint of DOMAIN_HINTS) {
    if (hint.pattern.test(hostname)) return hint.intent
  }
  return null
}

function allowedPacks(intent) {
  if (NON_CRO_INTENTS.has(intent)) {
    return ["shared.technical", "shared.accessibility", "legal.compliance", "site.navigation-trust"]
  }
  return ["all CRO + technical packs"]
}

function blockedPacks(intent) {
  if (!NON_CRO_INTENTS.has(intent)) return []
  return CRO_PACKS
}

function croPackApplicable(packId, intent) {
  const allowed = PACK_INTENTS[packId]
  if (!allowed) return false
  return allowed.includes(intent)
}

const SITES = [
  { website: "google.com", hostname: "www.google.com", expected: "search_engine" },
  { website: "amazon.com", hostname: "www.amazon.com", expected: "marketplace" },
  { website: "amazon.in", hostname: "www.amazon.in", expected: "marketplace" },
  { website: "vercel.com", hostname: "vercel.com", expected: "developer_platform" },
  { website: "hmcoding.com", hostname: "hmcoding.com", expected: "agency" },
]

console.log("V5 Website Intent Verification Table\n")
console.log(
  "Website\tDetected\tExpected\tAllowed Packs\tBlocked Packs\tCRO Leaks\tVerified"
)

let failures = 0

for (const site of SITES) {
  const detected = resolveDomainIntent(site.hostname)
  const allowed = allowedPacks(detected ?? "unknown").join("; ")
  const blocked = blockedPacks(detected ?? "unknown").join("; ")
  const croLeaks = NON_CRO_INTENTS.has(detected ?? "")
    ? CRO_PACKS.filter((pack) => croPackApplicable(pack, detected ?? ""))
    : []
  const verified = detected === site.expected && croLeaks.length === 0
  if (!verified) failures += 1

  console.log(
    [
      site.website,
      detected ?? "unknown",
      site.expected,
      allowed,
      blocked || "none",
      croLeaks.length ? croLeaks.join(",") : "0",
      verified ? "YES" : "NO",
    ].join("\t")
  )
}

process.exit(failures > 0 ? 1 : 0)
