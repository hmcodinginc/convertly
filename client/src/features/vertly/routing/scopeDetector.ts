import type { VertlyScope } from "@/features/vertly/types"
import {
  isVertlyGreeting,
  isVertlyIdentityQuestion,
  normalizeVertlyMessage,
} from "@/features/vertly/routing/normalizeVertlyMessage"

export type ScopeDetection = {
  scope: VertlyScope
  confidence: number
}

const REFUSAL_PATTERNS = [
  /\b(api key|api keys|secret key|secrets?)\b/i,
  /\b(access token|auth token|bearer token|jwt secret)\b/i,
  /\b(env variable|\.env|environment variable)\b/i,
  /\b(database password|db credentials|connection string)\b/i,
  /\b(razorpay key|stripe key|supabase key|service role)\b/i,
  /\b(give me your|show me your|reveal your).*(key|token|secret|password)/i,
  /\b(internal implementation|source code|codebase|server side)\b/i,
]

const OUT_OF_SCOPE_PATTERNS = [
  /\bprime minister\b/i,
  /\bwho is (the )?president\b/i,
  /\bseven wonders\b/i,
  /\bquantum physics\b/i,
  /\bexplain quantum\b/i,
  /\bwrite (a )?(python|java|c\+\+|golang|ruby|rust)\b/i,
  /\bwrite (a )?(react|vue|angular) component\b/i,
  /\bhelp me code\b/i,
  /\bdebug this code\b/i,
  /\bcapital of\b/i,
  /\bweather in\b/i,
  /\brecipe for\b/i,
  /\bgeneral knowledge\b/i,
]

const CONVERTLY_SCOPE_PATTERNS = [
  /\bconvertly\b/i,
  /\baudit\b/i,
  /\bbilling\b/i,
  /\bplan\b/i,
  /\bworkspace\b/i,
  /\bdashboard\b/i,
  /\breport\b/i,
  /\bscore\b/i,
  /\bfinding\b/i,
  /\brecommendation\b/i,
  /\bgrowth score\b/i,
  /\btrust score\b/i,
  /\ballowance\b/i,
  /\bdomain\b/i,
  /\bdraft\b/i,
  /\bpdf\b/i,
  /\bsettings\b/i,
  /\bmy (plan|audit|usage|account|workspace)\b/i,
  /\bhow many audits\b/i,
  /\bwhy (is|was|can't|can i not)\b/i,
  /\bexplain (this|the|my)\b/i,
  /\bwhat (does|is) this\b/i,
  /\bfix first\b/i,
  /\bcounted\b/i,
]

export function detectVertlyScope(message: string): ScopeDetection {
  if (REFUSAL_PATTERNS.some((pattern) => pattern.test(message))) {
    return { scope: "refusal", confidence: 0.98 }
  }

  if (isVertlyIdentityQuestion(message) || isVertlyGreeting(message)) {
    return { scope: "greeting", confidence: 0.96 }
  }

  const isConvertlyRelated = CONVERTLY_SCOPE_PATTERNS.some((pattern) => pattern.test(message))
  const isOffTopic = OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(message))

  if (isOffTopic && !isConvertlyRelated) {
    return { scope: "out_of_scope", confidence: 0.92 }
  }

  return { scope: "in_scope", confidence: isConvertlyRelated ? 0.88 : 0.72 }
}

export { normalizeVertlyMessage, isVertlyGreeting, isVertlyIdentityQuestion }
