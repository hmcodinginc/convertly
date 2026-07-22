// Transactional email via Resend (https://resend.com).
// When RESEND_API_KEY is not configured (e.g. local development), sends are
// skipped silently so the rest of the flow is unaffected.

export type SendEmailInput = {
  to: string
  subject: string
  html: string
}

export type SendEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; skipped: string }

export function isEmailConfigured(): boolean {
  return Boolean(Deno.env.get("RESEND_API_KEY"))
}

function getFromAddress(): string {
  return Deno.env.get("EMAIL_FROM") ?? "Convertly <onboarding@resend.dev>"
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY")
  if (!apiKey) {
    return { sent: false, skipped: "RESEND_API_KEY not configured" }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Resend request failed (${response.status}): ${body.slice(0, 300)}`)
  }

  const data = (await response.json().catch(() => null)) as { id?: string } | null
  return { sent: true, id: data?.id ?? null }
}

/** Minimal, client-safe HTML email layout shared by all Convertly notifications. */
export function renderEmailLayout(options: {
  heading: string
  bodyHtml: string
  footerNote?: string
}): string {
  const footer =
    options.footerNote ??
    "You are receiving this because email notifications are enabled in your Convertly settings. You can change this anytime under Settings → Notifications."

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1d23;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e6e8ec;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6d5ae6;">Convertly</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;">
                <h1 style="margin:0;font-size:20px;line-height:28px;font-weight:600;color:#1a1d23;">${options.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px 32px;font-size:14px;line-height:22px;color:#3d434d;">
                ${options.bodyHtml}
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:16px 32px;font-size:12px;line-height:18px;color:#8a8f99;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
