import type { AuditExecutionStageId } from "@/types/auditExecution"

const STAGE_INSIGHTS: Partial<Record<AuditExecutionStageId, string[]>> = {
  "preparing-workspace": ["Setting up your audit workspace...", "Getting everything ready."],
  "validating-website": ["Validating your website URL...", "Checking that the site is reachable."],
  "discovering-pages": [
    "Discovering public pages on your site...",
    "Mapping your site structure.",
  ],
  "capturing-screenshots": [
    "Capturing page screenshots...",
    "Recording desktop and mobile views.",
  ],
  "rendering-dom": ["Rendering page content...", "Loading your homepage..."],
  "detecting-navigation": [
    "Reviewing navigation structure...",
    "Navigation looks healthy so far.",
  ],
  "detecting-ctas": [
    "Scanning for calls-to-action...",
    "Looking for conversion blockers...",
  ],
  "detecting-forms": ["Checking forms and lead capture paths..."],
  "detecting-hero": ["Analyzing your hero section...", "Checking your homepage..."],
  "checking-trust": ["Evaluating trust signals...", "Reviewing social proof placement."],
  "checking-accessibility": ["I'm reviewing mobile usability.", "Checking accessibility patterns..."],
  "running-seo": ["Running SEO checks...", "Reviewing metadata and headings."],
  "running-mobile": ["Running mobile analysis...", "Testing responsive layout signals."],
  "calculating-scores": ["Calculating your Growth Score..."],
  "prioritizing-issues": [
    "Prioritizing issues by impact...",
    "Interesting... I found a few opportunities.",
  ],
  "building-recommendations": ["Building prioritized recommendations..."],
  "building-playbooks": ["Preparing implementation playbooks..."],
  "finalizing-report": ["Almost finished.", "Finalizing your audit report..."],
}

export function pickExecutionInsight(
  stageId: AuditExecutionStageId,
  domain: string,
  tick: number
): string {
  const pool = STAGE_INSIGHTS[stageId] ?? ["Analyzing your site..."]
  const message = pool[tick % pool.length]!

  if (message.includes("homepage") && domain) {
    return message.replace("homepage", domain)
  }

  return message
}
