import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, RefreshCw, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography/Text"
import { ROUTES } from "@/lib/routes"

type AuditExecutionBotProtectionProps = {
  domain?: string
  onRetry?: () => void
  onBack?: () => void
  className?: string
}

function AuditExecutionBotProtection({
  domain,
  onRetry,
  onBack,
  className,
}: AuditExecutionBotProtectionProps) {
  const [showLearnMore, setShowLearnMore] = useState(false)

  return (
    <div className={`audit-exec-outcome audit-exec-outcome--bot ${className ?? ""}`}>
      <div className="audit-exec-outcome__icon-wrap" aria-hidden>
        <ShieldAlert className="audit-exec-outcome__icon" />
      </div>

      <p className="audit-exec-outcome__eyebrow">Execution stopped</p>
      <h2 className="audit-exec-outcome__title">Bot protection detected</h2>
      <Text variant="muted" className="audit-exec-outcome__description">
        {domain
          ? `${domain} blocked automated access. Convertly couldn't complete the crawl without passing the site's protection layer.`
          : "This website blocked automated access. Convertly couldn't complete the crawl without passing the site's protection layer."}
      </Text>

      <div className="audit-exec-outcome__guidance">
        <div className="audit-exec-outcome__guidance-block">
          <p className="audit-exec-outcome__guidance-label">If you own this website</p>
          <ul className="audit-exec-outcome__guidance-list">
            <li>Temporarily disable bot protection or challenge mode</li>
            <li>Whitelist Convertly crawlers if your provider supports it</li>
            <li>Retry the audit once access is allowed</li>
          </ul>
        </div>
        <div className="audit-exec-outcome__guidance-block">
          <p className="audit-exec-outcome__guidance-label">If you don't own this website</p>
          <ul className="audit-exec-outcome__guidance-list">
            <li>Audit a different publicly accessible site instead</li>
            <li>Ask the site owner to run Convertly on their domain</li>
          </ul>
        </div>
      </div>

      {showLearnMore ? (
        <div className="audit-exec-outcome__learn-more">
          <Text size="sm" className="max-w-none leading-6">
            Cloudflare, WAF, and bot-management tools often block headless crawlers with
            JavaScript challenges or CAPTCHAs. Convertly needs to fetch HTML and render pages
            like a browser to score conversion paths. Allowlisting our crawler IP range or
            pausing strict bot mode during the audit usually resolves this.
          </Text>
        </div>
      ) : null}

      <div className="audit-exec-outcome__actions">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to New Audit
        </Button>
        <Button onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden />
          Retry
        </Button>
        <Button variant="ghost" onClick={() => setShowLearnMore((open) => !open)}>
          {showLearnMore ? "Hide details" : "Learn More"}
        </Button>
      </div>

      <Text variant="muted" size="sm" className="audit-exec-outcome__footnote">
        Need help?{" "}
        <Link to={ROUTES.settings} className="text-foreground/80 underline-offset-4 hover:underline">
          Contact support from Settings
        </Link>
      </Text>
    </div>
  )
}

export { AuditExecutionBotProtection }
