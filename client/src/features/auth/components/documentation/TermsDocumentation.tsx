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
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_GRIEVANCE_EMAIL,
} from "@/features/auth/content/legalConstants"

function TermsDocumentation() {
  return (
    <article className="auth-doc">
      <DocumentationMeta />

      <p className="auth-doc__intro">
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of Convertly,
        a software-as-a-service (SaaS) automated conversion audit platform owned and operated by{" "}
        {LEGAL_ENTITY_NAME}. By creating an account or using Convertly, you agree to these Terms.
      </p>

      <Callout title="MVP launch notice">
        Convertly is in active MVP development. Features, pricing, and policies may evolve as the
        product matures. Material changes will be reflected here with an updated date. Continued use
        after updates constitutes acceptance of the revised Terms.
      </Callout>

      <DocumentationSection id="overview" title="Overview" icon={FileText}>
        <p>
          Convertly provides website conversion analysis, audit reporting, prioritized
          recommendations, workspace tools, and related SaaS features for product and growth teams.
          The service is delivered online on a subscription basis. These Terms form a binding
          agreement between you and {LEGAL_ENTITY_NAME} (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;).
        </p>
        <p>
          All intellectual property in Convertly — including software, audit engine, branding,
          documentation, and generated report formats — remains the exclusive property of{" "}
          {LEGAL_ENTITY_NAME}.
        </p>
      </DocumentationSection>

      <DocumentationSection id="eligibility" title="Eligibility" icon={UserCheck}>
        <p>
          You must be at least 18 years old and capable of forming a binding contract under
          applicable law, including the Indian Contract Act, 1872. Convertly is not directed at
          minors. If you use Convertly on behalf of an organization, you represent that you have
          authority to bind that organization to these Terms.
        </p>
      </DocumentationSection>

      <DocumentationSection id="acceptable-use" title="Acceptable Use" icon={Ban}>
        <p>You agree not to:</p>
        <ul>
          <li>Audit websites you do not own or lack explicit permission to evaluate</li>
          <li>Submit URLs containing credentials, private intranet addresses, or unlawful content</li>
          <li>Attempt unauthorized access, scraping, reverse engineering, or interference with the platform</li>
          <li>Resell, sublicense, or misrepresent audit outputs as guaranteed business outcomes</li>
          <li>Use Convertly for unlawful, harmful, abusive, or infringing purposes</li>
          <li>Violate the Information Technology Act, 2000 or other applicable Indian law</li>
        </ul>
      </DocumentationSection>

      <DocumentationSection id="accounts" title="Accounts & Security" icon={Lock}>
        <p>
          You are responsible for maintaining the confidentiality of your credentials and for all
          activity under your account. You must provide accurate registration information and keep it
          current. Notify us promptly at{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          if you suspect unauthorized access.
        </p>
        <LegalNotice>
          We may suspend accounts that pose a security risk or violate these Terms, consistent with
          reasonable security practices under applicable IT rules.
        </LegalNotice>
      </DocumentationSection>

      <DocumentationSection id="billing" title="Subscription & Billing" icon={CreditCard}>
        <p>
          Paid plans, usage limits, and billing cycles are described at checkout and in your
          workspace. Subscriptions are billed in advance on a recurring basis (typically monthly)
          through our payment partner Razorpay. By subscribing, you authorize recurring charges until
          you cancel before the next renewal date.
        </p>
        <p>
          Prices are shown in Indian Rupees (INR) unless stated otherwise. Applicable GST or other
          taxes may be added as required by law. Plan changes, upgrades, or downgrades may take effect
          immediately or at the next billing cycle as shown during checkout.
        </p>
        <LegalNotice>
          Auto-renewal: Your subscription renews automatically unless cancelled through Billing or
          by contacting support before the renewal date. You are responsible for reviewing plan
          details before each renewal.
        </LegalNotice>
      </DocumentationSection>

      <DocumentationSection id="refunds" title="Refund Policy" icon={CreditCard}>
        <p>
          During the MVP phase, refund requests are reviewed on a case-by-case basis within 7 days
          of purchase if the service was materially unavailable, incorrectly charged, or if required
          under applicable consumer protection law. Contact{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          with your account email and Razorpay transaction reference.
        </p>
        <LegalNotice>
          Refund policies may be updated as Convertly exits MVP. Your plan page will always reflect
          current billing terms. Nothing in these Terms limits non-waivable rights under the Consumer
          Protection Act, 2019 where applicable.
        </LegalNotice>
      </DocumentationSection>

      <DocumentationSection id="ai-disclaimer" title="Automated Audit Outputs" icon={Shield}>
        <p>
          Convertly uses automated, rules-based analysis to generate scores, findings, and
          recommendations. Outputs are advisory and based on publicly reachable page data at the time
          of the audit. They do not constitute legal, financial, or professional advice.
        </p>
        <p>
          You are solely responsible for validating recommendations before deploying changes to
          production traffic. {LEGAL_ENTITY_NAME} does not guarantee specific conversion lifts,
          revenue outcomes, or ranking improvements.
        </p>
      </DocumentationSection>

      <DocumentationSection id="ip" title="Intellectual Property" icon={Shield}>
        <p>
          Convertly, its branding, software, audit engine, user interface, and documentation are owned
          by {LEGAL_ENTITY_NAME}. All rights not expressly granted are reserved.
        </p>
        <p>
          You retain ownership of your website content and data you submit. We grant you a limited,
          non-exclusive, non-transferable, revocable license to use Convertly for internal business
          purposes during an active subscription or trial. You may not copy, modify, or create
          derivative works of the platform except as permitted by law.
        </p>
      </DocumentationSection>

      <DocumentationSection id="data-processing" title="Data & Privacy" icon={Users}>
        <p>
          Our collection and use of personal data is described in the Privacy Policy. By using
          Convertly, you consent to such processing where required under the Digital Personal Data
          Protection Act, 2023 (DPDP Act) and other applicable law. If you submit URLs or audit data
          on behalf of a third party, you represent that you have lawful authority to do so.
        </p>
      </DocumentationSection>

      <DocumentationSection id="liability" title="Limitation of Liability" icon={Scale}>
        <p>
          Convertly is provided on an &quot;as is&quot; and &quot;as available&quot; basis during
          MVP. To the maximum extent permitted by law, {LEGAL_ENTITY_NAME} is not liable for
          indirect, incidental, special, consequential, or punitive damages, including lost revenue,
          profits, data, or goodwill arising from use of the service or reliance on audit
          recommendations.
        </p>
        <p>
          Our aggregate liability for any claim relating to the service shall not exceed the fees
          paid by you to {LEGAL_ENTITY_NAME} in the twelve (12) months preceding the claim, except
          where liability cannot be limited under mandatory law.
        </p>
      </DocumentationSection>

      <DocumentationSection id="indemnity" title="Indemnity" icon={Scale}>
        <p>
          You agree to indemnify and hold harmless {LEGAL_ENTITY_NAME} from claims, losses, and
          expenses (including reasonable legal fees) arising from your misuse of Convertly, violation
          of these Terms, unauthorized audits, or infringement of third-party rights through your
          use of the service.
        </p>
      </DocumentationSection>

      <DocumentationSection id="termination" title="Termination" icon={Ban}>
        <p>
          You may close your account at any time from Settings. We may suspend or terminate access
          if you violate these Terms, fail to pay applicable fees, or if required for security or
          legal compliance. Upon termination, your right to use Convertly ceases, subject to
          applicable data retention policies in our Privacy Policy.
        </p>
      </DocumentationSection>

      <DocumentationSection id="governing-law" title="Governing Law & Disputes" icon={Globe}>
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law
          principles. Disputes shall be subject to the exclusive jurisdiction of competent courts in
          India, unless otherwise required by mandatory consumer protection law.
        </p>
        <p>
          Before initiating formal proceedings, you may contact our grievance channel at{" "}
          <a
            href={`mailto:${LEGAL_GRIEVANCE_EMAIL}`}
            className="text-[var(--accent)] hover:underline"
          >
            {LEGAL_GRIEVANCE_EMAIL}
          </a>{" "}
          so we can attempt good-faith resolution within a reasonable period.
        </p>
      </DocumentationSection>

      <DocumentationSection id="contact" title="Contact" icon={Mail}>
        <p>
          Questions about these Terms? Email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[var(--accent)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          or write to {LEGAL_ENTITY_NAME}, India.
        </p>
      </DocumentationSection>
    </article>
  )
}

export { TermsDocumentation }
