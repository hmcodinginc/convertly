/**
 * V5 applicability verification — run: node scripts/verify-v5-applicability.mjs
 */
import { pathToFileURL } from "node:url"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, "../src")

async function load(modulePath) {
  return import(pathToFileURL(modulePath).href)
}

const { buildProductionRuleDefinitions } = await load(
  path.join(src, "services/audit/intelligence/rules/buildProductionRules.ts")
)
const { getRuleRegistry } = await load(
  path.join(src, "services/audit/intelligence/rules/ruleRegistry.ts")
)
const { isRuleApplicableToWebsiteIntent } = await load(
  path.join(src, "services/audit/intelligence/websiteRuleApplicability.ts")
)
const { evaluateRuleExecutionApplicability } = await load(
  path.join(src, "services/audit/intelligence/applicability/applicabilityEngine.ts")
)
const { getRuleIdsForIntent } = await load(
  path.join(src, "services/audit/intelligence/pageIntentDetection.ts")
)
const { getPackRuleIds } = await load(
  path.join(src, "services/audit/intelligence/rules/rulePacks.ts")
)

const registry = getRuleRegistry()
if (!registry.isInitialized()) {
  registry.registerMany(buildProductionRuleDefinitions())
}

const PLATFORM_INTENTS = [
  "search_engine",
  "marketplace",
  "developer_platform",
  "documentation",
  "open_source",
  "dashboard",
]

const CRO_PACKS = [
  "homepage.conversion",
  "homepage.trust",
  "services.conversion",
  "services.trust",
  "contact.conversion",
  "pricing.conversion",
  "signup.conversion",
  "projects.conversion",
]

const croRuleIds = new Set()
for (const pack of CRO_PACKS) {
  for (const id of getPackRuleIds(pack)) croRuleIds.add(id)
}

let failures = 0

console.log("V5 Applicability Verification")
console.log("rulesRegistered:", registry.getAll().length)

for (const intent of PLATFORM_INTENTS) {
  const homepageRules = getRuleIdsForIntent("homepage")
  const execApplicable = homepageRules.filter(
    (id) =>
      evaluateRuleExecutionApplicability(id, {
        websiteIntent: intent,
        pageIntent: "homepage",
      }).applicable
  )
  const croLeaks = execApplicable.filter((id) => croRuleIds.has(id))

  const status = croLeaks.length === 0 ? "PASS" : "FAIL"
  if (croLeaks.length > 0) failures += 1

  console.log(
    `${status} ${intent}: homepage CRO leaks=${croLeaks.length}`,
    croLeaks.length ? croLeaks.join(", ") : ""
  )
}

process.exit(failures > 0 ? 1 : 0)
