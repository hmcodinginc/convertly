import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/typography/Heading"
import {
  AboutDocumentation,
  PrivacyDocumentation,
  TermsDocumentation,
} from "@/features/auth/components/documentation"
import { useAuthPanel } from "@/hooks/useAuthPanel"
import { legalContent, type AuthLegalView } from "@/features/auth/content/authContent"

import "@/features/auth/components/documentation/auth-documentation.css"

type AuthLegalPanelProps = {
  view: AuthLegalView
}

function LegalDocumentationBody({ view }: { view: AuthLegalView }) {
  switch (view) {
    case "terms":
      return <TermsDocumentation />
    case "privacy":
      return <PrivacyDocumentation />
    case "about":
      return <AboutDocumentation />
    default:
      return null
  }
}

function AuthLegalPanel({ view }: AuthLegalPanelProps) {
  const { closeLegal } = useAuthPanel()
  const content = legalContent[view]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 flex items-start justify-between gap-4">
        <Heading level={2} size="section" className="max-w-none">
          {content.title}
        </Heading>
        <Button variant="outline" size="sm" type="button" onClick={closeLegal}>
          Back to product
        </Button>
      </div>

      <div className="auth-legal-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <LegalDocumentationBody view={view} />
      </div>
    </div>
  )
}

export { AuthLegalPanel }
