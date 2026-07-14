import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { Container } from "@/components/layout/Container"
import { Navbar } from "@/components/layout/Navbar"
import { Heading } from "@/components/ui/typography/Heading"
import {
  PrivacyDocumentation,
  TermsDocumentation,
} from "@/features/auth/components/documentation"
import { legalContent, type AuthLegalView } from "@/features/auth/content/authContent"
import { ROUTES } from "@/lib/routes"

import "@/features/auth/components/documentation/auth-documentation.css"

type LegalPageProps = {
  view: Extract<AuthLegalView, "terms" | "privacy">
}

function LegalPage({ view }: LegalPageProps) {
  const content = legalContent[view]

  return (
    <main className="app-atmosphere min-h-dvh">
      <Navbar />

      <Container className="marketing-container py-10 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            to={ROUTES.home}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground/62 transition-colors hover:text-foreground/90"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Convertly
          </Link>

          <Heading level={1} size="title" className="max-w-none">
            {content.title}
          </Heading>

          <div className="auth-legal-scroll max-h-none overflow-visible pr-0">
            {view === "terms" ? <TermsDocumentation /> : <PrivacyDocumentation />}
          </div>
        </div>
      </Container>
    </main>
  )
}

export { LegalPage }
