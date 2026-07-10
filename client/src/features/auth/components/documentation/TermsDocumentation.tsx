import {
  Ban,
  CreditCard,
  FileText,
  Globe,
  Lock,
  Mail,
  Scale,
  Shield,
  UserCheck,
  Users,
} from "lucide-react"

import { Callout } from "@/features/auth/components/documentation/Callout"
import { DocumentationMeta } from "@/features/auth/components/documentation/DocumentationMeta"
import { DocumentationSection } from "@/features/auth/components/documentation/DocumentationSection"
import { LegalNotice } from "@/features/auth/components/documentation/LegalNotice"
import { LEGAL_CONTACT_EMAIL } from "@/features/auth/content/legalConstants"

function TermsDocumentation() {
  return (
    <article className="auth-doc">
      <DocumentationMeta />

      <p className="auth-doc__intro">
        These Terms &amp; Conditions govern your access to and use of Convertly, an AI-assisted
        conversion audit platform operated by HM Coding. Please read them carefully before
        creating an account.
      </p>

      <Callout title="MVP launch notice">
        Convertly is in active MVP development. Features, pricing, and policies may evolve as the
        product matures. Material changes will be reflected here with an updated date.
      </Callout>

      <DocumentationSection id="overview" title="Overview" icon={FileText}>
        <p>
          Convertly provides website conversion analysis, audit reporting, prioritized
          recommendations, and related workflow tools for product and growth teams. By using the
          service, you enter a binding agreement with HM Coding (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;).
        </p>
      </DocumentationSection>

      <DocumentationSection id="eligibility" title="Eligibility" icon={UserCheck}>
        <p>
          You must be at least 18 years old and capable of forming a binding contract under
          applicable law. If you use Convertly on behalf of an organization, you represent that you
          have authority to bind that organization to these terms.
        </p>
      </DocumentationSection>

      <DocumentationSection id="acceptable-use" title="Acceptable Use" icon={Ban}>
        <p>You agree not to:</p>
        <ul>
          <li>Audit websites you do not own or lack explicit permission to evaluate</li>
          <li>Attempt unauthorized access, scraping, or interference with the platform</li>
          <li>Reverse engineer, resell, or misrepresent audit outputs as guaranteed outcomes</li>
          <li>Use Convertly for unlawful, harmful, or abusive purposes</li>
        </ul>
      </DocumentationSection>

      <DocumentationSection id="accounts" title="Accounts & Security" icon={Lock}>
        <p>
          You are responsible for maintaining the confidentiality of your credentials and for all
          activity under your account. Notify us promptly at{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          if you suspect unauthorized access.
        </p>
      </DocumentationSection>

      <DocumentationSection id="billing" title="Subscription & Billing" icon={CreditCard}>
        <p>
          Paid plans, usage limits, and billing cycles are described at checkout and in your
          workspace. Subscriptions renew according to the plan you select unless cancelled before
          the renewal date. Taxes may apply based on your jurisdiction.
        </p>
      </DocumentationSection>

      <DocumentationSection id="refunds" title="Refund Policy" icon={CreditCard}>
        <p>
          During the MVP phase, refund requests are reviewed on a case-by-case basis within 7 days
          of purchase if the service was materially unavailable or incorrectly charged. Contact{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          with your account email and transaction reference.
        </p>
        <LegalNotice>
          Refund policies may be updated as Convertly exits MVP. Your plan page will always reflect
          current billing terms.
        </LegalNotice>
      </DocumentationSection>

      <DocumentationSection id="ip" title="Intellectual Property" icon={Shield}>
        <p>
          Convertly, its branding, software, audit engine, and documentation are owned by HM
          Coding. You retain ownership of your website content and data. We grant you a limited,
          non-exclusive license to use Convertly for internal business purposes during your
          subscription.
        </p>
      </DocumentationSection>

      <DocumentationSection id="liability" title="Limitation of Liability" icon={Scale}>
        <p>
          Convertly is provided on an &quot;as is&quot; and &quot;as available&quot; basis during
          MVP. To the maximum extent permitted by law, HM Coding is not liable for indirect,
          incidental, special, or consequential damages, including lost revenue or profits arising
          from audit recommendations or implementation decisions.
        </p>
        <p>
          Audit scores and recommendations are advisory. You are responsible for validating changes
          before deploying them to production traffic.
        </p>
      </DocumentationSection>

      <DocumentationSection id="termination" title="Termination" icon={Ban}>
        <p>
          You may close your account at any time from Settings. We may suspend or terminate access
          if you violate these terms or if required for security or legal compliance. Upon
          termination, your right to use Convertly ceases, subject to applicable data retention
          policies.
        </p>
      </DocumentationSection>

      <DocumentationSection id="governing-law" title="Governing Law" icon={Globe}>
        <p>
          These terms are governed by the laws of India, without regard to conflict-of-law
          principles. Disputes shall be subject to the exclusive jurisdiction of courts located in
          India, unless otherwise required by mandatory consumer protection law.
        </p>
      </DocumentationSection>

      <DocumentationSection id="contact" title="Contact" icon={Mail}>
        <p>
          Questions about these terms? Email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          or write to HM Coding, India.
        </p>
      </DocumentationSection>
    </article>
  )
}

export { TermsDocumentation }
