import {
  Cookie,
  Database,
  Eye,
  FileSearch,
  Lock,
  Mail,
  Server,
  Shield,
  Trash2,
  User,
} from "lucide-react"

import { Callout } from "@/features/auth/components/documentation/Callout"
import { DocumentationMeta } from "@/features/auth/components/documentation/DocumentationMeta"
import { DocumentationSection } from "@/features/auth/components/documentation/DocumentationSection"
import { InfoGrid } from "@/features/auth/components/documentation/InfoGrid"
import { DocumentationCard } from "@/features/auth/components/documentation/DocumentationCard"
import { LegalNotice } from "@/features/auth/components/documentation/LegalNotice"
import { LEGAL_CONTACT_EMAIL } from "@/features/auth/content/legalConstants"

function PrivacyDocumentation() {
  return (
    <article className="auth-doc">
      <DocumentationMeta />

      <p className="auth-doc__intro">
        This Privacy Policy explains how HM Coding collects, uses, and protects information when
        you use Convertly. We design our data practices to support audit quality while minimizing
        what we collect.
      </p>

      <DocumentationSection id="overview" title="Overview" icon={Shield}>
        <p>
          Convertly processes account information, audit configuration data, and website analysis
          artifacts to deliver conversion reports. We do not sell personal data.
        </p>
      </DocumentationSection>

      <DocumentationSection id="collect" title="Information We Collect" icon={User}>
        <InfoGrid>
          <DocumentationCard title="Account data">
            Name, email address, authentication identifiers, and workspace preferences you provide
            during signup or settings.
          </DocumentationCard>
          <DocumentationCard title="Usage data">
            Feature interactions, audit counts, plan usage, and diagnostic logs needed to operate
            and improve the product.
          </DocumentationCard>
        </InfoGrid>
      </DocumentationSection>

      <DocumentationSection id="audit-data" title="Audit Data" icon={FileSearch}>
        <p>
          When you run an audit, Convertly discovers and analyzes publicly reachable pages from the
          URL you submit. This may include page titles, DOM structure, metadata, screenshots, and
          derived findings. You should only audit sites you own or are authorized to evaluate.
        </p>
        <Callout variant="info" title="Your responsibility">
          Do not submit URLs containing credentials, private intranet addresses, or customer data
          you are not permitted to process through Convertly.
        </Callout>
      </DocumentationSection>

      <DocumentationSection id="billing-info" title="Billing Information" icon={Database}>
        <p>
          Paid subscriptions are processed through our payment provider. Convertly stores plan
          status, entitlement usage, and billing references — not full payment card numbers on our
          servers.
        </p>
      </DocumentationSection>

      <DocumentationSection id="cookies" title="Cookies & Analytics" icon={Cookie}>
        <p>
          We use essential cookies and local storage for authentication sessions and product
          preferences. Optional analytics help us understand feature adoption and improve reliability
          during MVP. You can control non-essential cookies through your browser settings.
        </p>
      </DocumentationSection>

      <DocumentationSection id="third-party" title="Third-party Services" icon={Server}>
        <p>Convertly relies on infrastructure partners to deliver the service, including:</p>
        <ul>
          <li>Cloud hosting and database providers (e.g. Supabase)</li>
          <li>Payment processors for subscription billing</li>
          <li>Email delivery for account and security notifications</li>
        </ul>
        <p>
          These providers process data only as needed to perform their function and under
          contractual security obligations.
        </p>
      </DocumentationSection>

      <DocumentationSection id="retention" title="Data Retention" icon={Database}>
        <p>
          Audit reports and session history are retained while your account is active so you can
          compare runs over time. You may delete individual audits from your history. Account
          deletion triggers removal of associated personal data subject to legal retention
          requirements.
        </p>
      </DocumentationSection>

      <DocumentationSection id="security" title="Security Practices" icon={Lock}>
        <p>
          We apply industry-standard safeguards including encrypted transport (HTTPS), access
          controls, and secure credential handling. No system is perfectly secure — report
          suspected vulnerabilities to{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </DocumentationSection>

      <DocumentationSection id="rights" title="Your Rights" icon={Eye}>
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, export, or
          restrict processing of your personal data. Contact us to submit a request — we respond
          within a reasonable timeframe.
        </p>
      </DocumentationSection>

      <DocumentationSection id="delete" title="Delete Account" icon={Trash2}>
        <p>
          You can request account deletion from Settings → Danger Zone. Deletion is irreversible
          and removes audits, workspace data, and billing entitlements tied to your account, except
          where retention is required for legal or fraud-prevention purposes.
        </p>
        <LegalNotice>
          Export any audit reports you need before deleting your account.
        </LegalNotice>
      </DocumentationSection>

      <DocumentationSection id="contact" title="Contact" icon={Mail}>
        <p>
          Privacy questions or data requests:{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
      </DocumentationSection>
    </article>
  )
}

export { PrivacyDocumentation }
