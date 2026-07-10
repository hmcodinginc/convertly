import { Calendar, RefreshCw } from "lucide-react"

import { LEGAL_EFFECTIVE_DATE, LEGAL_LAST_UPDATED } from "@/features/auth/content/legalConstants"

function DocumentationMeta() {
  return (
    <div className="auth-doc__meta">
      <span className="auth-doc__meta-item">
        <Calendar className="size-3" aria-hidden />
        Effective {LEGAL_EFFECTIVE_DATE}
      </span>
      <span className="auth-doc__meta-item">
        <RefreshCw className="size-3" aria-hidden />
        Updated {LEGAL_LAST_UPDATED}
      </span>
    </div>
  )
}

export { DocumentationMeta }
