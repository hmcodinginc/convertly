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
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_GRIEVANCE_EMAIL,
} from "@/features/auth/content/legalConstants"

function PrivacyDocumentation() {
  return (
    <article className="auth-doc">
      <DocumentationMeta />

      <p className="auth-doc__intro">
        This Privacy Policy explains how {LEGAL_ENTITY_NAME} (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;) collects, uses, stores, and protects personal data when you use Convertly,
        our SaaS conversion audit platform. We act as a Data Fiduciary under the Digital Personal
        Data Protection Act, 2023 (DPDP Act) for personal data we determine the purpose and means
        of processing.
      </p>

      <DocumentationSection id="overview" title="Overview" icon={Shield}>
        <p>
          Convertly processes account information, audit configuration data, and website analysis
          artifacts to deliver conversion reports and related features. We do not sell personal data.
          We process data only for specified, lawful purposes and apply reasonable security
          practices consistent with the Information Technology Act, 2000 and applicable rules.
        </p>
      </DocumentationSection>

      <DocumentationSection id="collect" title="Information We Collect" icon={User}>
        <InfoGrid>
          <DocumentationCard title="Account data">
            Name, email address, authentication identifiers, workspace preferences, and billing
            references you provide during signup, checkout, or settings.
          </DocumentationCard>
          <DocumentationCard title="Usage data">
            Feature interactions, audit counts, plan usage, device/browser metadata, and diagnostic
            logs needed to operate, secure, and improve the product.
          </DocumentationCard>
        </InfoGrid>
        <p className="mt-4">
          We may also receive limited payment status information from Razorpay (such as transaction
          IDs and subscription state). We do not store full payment card numbers on our servers.
        </p>
      </DocumentationSection>

      <DocumentationSection id="audit-data" title="Audit Data" icon={FileSearch}>
        <p>
          When you run an audit, Convertly discovers and analyzes publicly reachable pages from the
          URL you submit. This may include page titles, DOM structure, metadata, screenshots, and
          derived findings. Audit artifacts may be stored in your workspace history while your
          account is active.
        </p>
        <Callout variant="info" title="Your responsibility">
          Do not submit URLs containing credentials, private intranet addresses, personal data you
          are not authorized to process, or content that violates applicable law. You must have
          lawful authority to audit each submitted website.
        </Callout>
      </DocumentationSection>

      <DocumentationSection id="lawful-basis" title="Lawful Basis & Consent" icon={Shield}>
        <p>
          We process personal data based on one or more of the following, as applicable under Indian
          law:
        </p>
        <ul>
          <li>Your consent (for example, when you create an account or accept these policies)</li>
          <li>Performance of our contract to provide Convertly to you</li>
          <li>Compliance with legal obligations</li>
          <li>Legitimate uses permitted under the DPDP Act, such as security and fraud prevention</li>
        </ul>
        <p>
          Where consent is the basis, you may withdraw it by closing your account or contacting us.
          Withdrawal does not affect processing already performed lawfully before withdrawal.
        </p>
      </DocumentationSection>

      <DocumentationSection id="billing-info" title="Billing Information" icon={Database}>
        <p>
          Paid subscriptions are processed through Razorpay, a regulated payment aggregator. Razorpay
          may collect payment instrument details directly during checkout. Convertly stores plan
          status, entitlement usage, invoice references, and Razorpay subscription identifiers — not
          full card numbers.
        </p>
      </DocumentationSection>

      <DocumentationSection id="cookies" title="Cookies & Analytics" icon={Cookie}>
        <p>
          We use essential cookies and local storage for authentication sessions, security, and
          product preferences. Optional analytics help us understand feature adoption and improve
          reliability during MVP. You can control non-essential cookies through your browser
          settings. Disabling essential cookies may limit core functionality.
        </p>
      </DocumentationSection>

      <DocumentationSection id="third-party" title="Third-party Services" icon={Server}>
        <p>Convertly relies on infrastructure and service partners, including:</p>
        <ul>
          <li>Cloud hosting and database providers (e.g. Supabase)</li>
          <li>Razorpay for subscription billing and payment processing</li>
          <li>Email delivery for account, billing, and security notifications</li>
        </ul>
        <p>
          These processors handle data only to perform their function and under contractual
          confidentiality and security obligations. Some providers may process data outside India;
          where cross-border transfer occurs, we take steps consistent with applicable law and
          contractual safeguards.
        </p>
      </DocumentationSection>

      <DocumentationSection id="retention" title="Data Retention" icon={Database}>
        <p>
          Audit reports and session history are retained while your account is active so you can
          compare runs over time. You may delete individual audits from your history. Account
          deletion triggers removal of associated personal data subject to legal, tax, accounting, or
          fraud-prevention retention requirements.
        </p>
      </DocumentationSection>

      <DocumentationSection id="security" title="Security Practices" icon={Lock}>
        <p>
          We apply reasonable security practices including encrypted transport (HTTPS), access
          controls, role-based permissions, and secure credential handling. No system is perfectly
          secure — report suspected vulnerabilities to{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </DocumentationSection>

      <DocumentationSection id="rights" title="Your Rights (India)" icon={Eye}>
        <p>
          Under the DPDP Act and related rules, you may have rights to:
        </p>
        <ul>
          <li>Access a summary of personal data we process and the processing activities</li>
          <li>Correct or update inaccurate or incomplete personal data</li>
          <li>Withdraw consent where processing is consent-based</li>
          <li>Request erasure when retention is no longer necessary and not required by law</li>
          <li>Nominate another individual to exercise your rights in the event of death or incapacity</li>
          <li>Grievance redressal through our designated officer</li>
        </ul>
        <p>
          Submit requests to{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          . We respond within timelines required by applicable law, typically within 30 days for
          grievances under the DPDP framework.
        </p>
      </DocumentationSection>

      <DocumentationSection id="grievance" title="Grievance Officer" icon={Mail}>
        <p>
          In accordance with the DPDP Act and Information Technology (Intermediary Guidelines and
          Digital Media Ethics Code) Rules, 2021, {LEGAL_ENTITY_NAME} has designated a grievance
          contact for privacy and data-protection concerns:
        </p>
        <ul>
          <li>
            Email:{" "}
            <a
              href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`}
              className="text-[var(--accent)] hover:underline"
            >
              {LEGAL_GRIEVANCE_EMAIL}
            </a>
          </li>
          <li>Entity: {LEGAL_ENTITY_NAME}, India</li>
        </ul>
        <LegalNotice>
          We acknowledge grievances within a reasonable period and aim to resolve them within 30
          days, or as otherwise required by law.
        </LegalNotice>
      </DocumentationSection>

      <DocumentationSection id="children" title="Children's Data" icon={User}>
        <p>
          Convertly is not intended for individuals under 18. We do not knowingly collect personal
          data from minors. If you believe a minor has provided data, contact us to request deletion.
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

      <DocumentationSection id="changes" title="Policy Updates" icon={Shield}>
        <p>
          We may update this Privacy Policy as Convertly evolves or as law changes. Material updates
          will be posted here with a revised &quot;Updated&quot; date. Continued use after changes
          constitutes acknowledgment where permitted by law.
        </p>
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
