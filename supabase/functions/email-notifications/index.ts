// Email notification dispatcher.
//
// Actions:
//   - "audit_completed": invoked by the client when an audit finishes.
//     Authenticated with the caller's JWT. Sends the audit-complete email
//     and, when applicable, a score-drop alert — both gated by the user's
//     notification_preferences row.
//   - "weekly_digest": invoked by a scheduler (Supabase cron / pg_cron).
//     Authenticated with the NOTIFICATIONS_CRON_SECRET header. Sends a
//     summary of the past week's completed audits to every user who has
//     the weekly digest enabled.
//
// Required secrets: RESEND_API_KEY (sends are skipped without it),
// EMAIL_FROM (optional, defaults to the Resend onboarding sender),
// NOTIFICATIONS_CRON_SECRET (required for weekly_digest only),
// APP_URL (weekly digest links only — user-triggered emails derive the
// origin from the request's Origin header).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import {
  authenticateRequest,
  corsHeaders,
  createAdminClient,
  getAppOrigin,
  jsonResponse,
} from "../_shared/payment/common.ts"
import { isEmailConfigured, renderEmailLayout, sendEmail } from "../_shared/email/resend.ts"

type NotificationPreferencesRow = {
  user_id: string
  weekly_digest: boolean
  audit_complete_email: boolean
  score_drop_alerts: boolean
  score_drop_threshold: number
}

type AuditRow = {
  id: string
  user_id: string
  website_url: string
  status: string
  updated_at: string
}

type ScoreRow = {
  audit_id: string
  category: string
  score: number | null
}

function normalizeDomain(websiteUrl: string): string {
  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(websiteUrl)
      ? websiteUrl
      : `https://${websiteUrl}`
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return websiteUrl.toLowerCase()
  }
}

function resolveGrowthScore(scores: ScoreRow[]): number | null {
  const growth = scores.find((s) => s.category === "growth")
  if (growth?.score != null) return Math.round(Number(growth.score))
  const overall = scores.find((s) => s.category === "overall")
  if (overall?.score != null) return Math.round(Number(overall.score))
  return null
}

async function loadScores(admin: SupabaseClient, auditIds: string[]): Promise<ScoreRow[]> {
  if (auditIds.length === 0) return []
  const { data, error } = await admin
    .from("audit_scores")
    .select("audit_id, category, score")
    .in("audit_id", auditIds)
    .in("category", ["growth", "overall"])
  if (error) throw new Error(error.message)
  return (data ?? []) as ScoreRow[]
}

/**
 * Origin for links inside emails. Browser-triggered requests carry an Origin
 * header that reflects the app host actually in use (production, staging, or
 * localhost), which is always correct. Cron-invoked digests have no Origin
 * and fall back to the APP_URL secret.
 */
function resolveAppOrigin(req?: Request): string {
  const origin = req?.headers.get("Origin")
  if (origin) {
    try {
      const parsed = new URL(origin)
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.origin
      }
    } catch {
      // Malformed Origin header — fall back to APP_URL.
    }
  }
  return getAppOrigin()
}

function reportLink(appOrigin: string, auditId: string): string {
  return `${appOrigin}/audits/${auditId}`
}

async function handleAuditCompleted(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const { user, supabaseUrl, serviceRoleKey } = auth

  if (!user.email) {
    return jsonResponse({ sent: false, reason: "no_email" }, 200)
  }

  const body = (await req.json().catch(() => null)) as { auditId?: string } | null
  const auditId = body?.auditId
  if (!auditId || typeof auditId !== "string") {
    return jsonResponse({ error: "auditId is required" }, 400)
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey)

  const { data: prefs, error: prefsError } = await admin
    .from("notification_preferences")
    .select("user_id, weekly_digest, audit_complete_email, score_drop_alerts, score_drop_threshold")
    .eq("user_id", user.id)
    .maybeSingle()
  if (prefsError) {
    console.error("email-notifications: preferences lookup failed", prefsError)
    return jsonResponse({ error: "Unable to load preferences" }, 500)
  }
  const preferences = prefs as NotificationPreferencesRow | null
  if (!preferences || (!preferences.audit_complete_email && !preferences.score_drop_alerts)) {
    return jsonResponse({ sent: false, reason: "disabled" }, 200)
  }

  const { data: auditData, error: auditError } = await admin
    .from("audits")
    .select("id, user_id, website_url, status, updated_at")
    .eq("id", auditId)
    .maybeSingle()
  if (auditError || !auditData) {
    return jsonResponse({ error: "Audit not found" }, 404)
  }
  const audit = auditData as AuditRow
  if (audit.user_id !== user.id) {
    return jsonResponse({ error: "Audit not found" }, 404)
  }
  if (audit.status !== "completed") {
    return jsonResponse({ sent: false, reason: "not_completed" }, 200)
  }

  const appOrigin = resolveAppOrigin(req)
  const domain = normalizeDomain(audit.website_url)
  const scores = await loadScores(admin, [audit.id])
  const growthScore = resolveGrowthScore(scores)

  const results: Record<string, unknown> = {}

  if (preferences.audit_complete_email) {
    const scoreLine =
      growthScore != null
        ? `<p style="margin:0 0 12px 0;">Growth Score: <strong style="font-size:16px;">${growthScore}</strong>/100</p>`
        : ""
    try {
      results.auditComplete = await sendEmail({
        to: user.email,
        subject: `Your audit for ${domain} is complete`,
        html: renderEmailLayout({
          heading: `Audit complete — ${domain}`,
          bodyHtml: `
            <p style="margin:0 0 12px 0;">Your conversion audit for <strong>${domain}</strong> has finished running.</p>
            ${scoreLine}
            <p style="margin:0;"><a href="${reportLink(appOrigin, audit.id)}" style="color:#6d5ae6;font-weight:600;">View the full report</a></p>
          `,
        }),
      })
    } catch (error) {
      console.error("email-notifications: audit-complete send failed", error)
      results.auditComplete = { sent: false, error: true }
    }
  }

  if (preferences.score_drop_alerts && growthScore != null) {
    try {
      const alert = await maybeSendScoreDropAlert(admin, {
        email: user.email,
        audit,
        domain,
        growthScore,
        threshold: preferences.score_drop_threshold,
        appOrigin,
      })
      results.scoreDrop = alert
    } catch (error) {
      console.error("email-notifications: score-drop send failed", error)
      results.scoreDrop = { sent: false, error: true }
    }
  }

  return jsonResponse({ ok: true, ...results }, 200)
}

async function maybeSendScoreDropAlert(
  admin: SupabaseClient,
  input: {
    email: string
    audit: AuditRow
    domain: string
    growthScore: number
    threshold: number
    appOrigin: string
  }
): Promise<Record<string, unknown>> {
  if (input.growthScore >= input.threshold) {
    return { sent: false, reason: "above_threshold" }
  }

  // Find the most recent previously completed audit for the same domain.
  const { data, error } = await admin
    .from("audits")
    .select("id, website_url, status, updated_at, user_id")
    .eq("user_id", input.audit.user_id)
    .eq("status", "completed")
    .neq("id", input.audit.id)
    .order("updated_at", { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)

  const previous = ((data ?? []) as AuditRow[]).find(
    (row) => normalizeDomain(row.website_url) === input.domain
  )
  if (!previous) {
    return { sent: false, reason: "no_previous_audit" }
  }

  const previousScores = await loadScores(admin, [previous.id])
  const previousScore = resolveGrowthScore(previousScores)
  if (previousScore == null || previousScore < input.threshold) {
    // Only alert when the score crossed the threshold, not on every low run.
    return { sent: false, reason: "no_threshold_crossing" }
  }

  const result = await sendEmail({
    to: input.email,
    subject: `Growth Score dropped below ${input.threshold} for ${input.domain}`,
    html: renderEmailLayout({
      heading: `Score drop alert — ${input.domain}`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;">The latest audit for <strong>${input.domain}</strong> scored <strong>${input.growthScore}</strong>/100, down from <strong>${previousScore}</strong> and below your alert threshold of ${input.threshold}.</p>
        <p style="margin:0;"><a href="${reportLink(input.appOrigin, input.audit.id)}" style="color:#6d5ae6;font-weight:600;">Review what changed</a></p>
      `,
    }),
  })
  return { ...result }
}

async function handleWeeklyDigest(req: Request): Promise<Response> {
  const secret = Deno.env.get("NOTIFICATIONS_CRON_SECRET")
  const provided = req.headers.get("x-cron-secret")
  if (!secret || !provided || provided !== secret) {
    return jsonResponse({ error: "Forbidden" }, 403)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration error" }, 500)
  }
  const admin = createAdminClient(supabaseUrl, serviceRoleKey)
  // Cron requests carry no browser Origin — links use the APP_URL secret.
  const appOrigin = resolveAppOrigin()

  const { data: prefsData, error: prefsError } = await admin
    .from("notification_preferences")
    .select("user_id, weekly_digest, audit_complete_email, score_drop_alerts, score_drop_threshold")
    .eq("weekly_digest", true)
  if (prefsError) {
    console.error("email-notifications: digest preferences query failed", prefsError)
    return jsonResponse({ error: "Unable to load preferences" }, 500)
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let sent = 0
  let skipped = 0

  for (const pref of (prefsData ?? []) as NotificationPreferencesRow[]) {
    try {
      const { data: auditsData, error: auditsError } = await admin
        .from("audits")
        .select("id, website_url, status, updated_at, user_id")
        .eq("user_id", pref.user_id)
        .eq("status", "completed")
        .gte("updated_at", weekAgo)
        .order("updated_at", { ascending: false })
        .limit(20)
      if (auditsError) throw new Error(auditsError.message)

      const audits = (auditsData ?? []) as AuditRow[]
      if (audits.length === 0) {
        skipped += 1
        continue
      }

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(
        pref.user_id
      )
      const email = userData?.user?.email
      if (userError || !email) {
        skipped += 1
        continue
      }

      const scores = await loadScores(admin, audits.map((audit) => audit.id))
      const rows = audits
        .map((audit) => {
          const score = resolveGrowthScore(scores.filter((s) => s.audit_id === audit.id))
          const scoreText = score != null ? `${score}/100` : "—"
          return `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #eceef1;"><a href="${reportLink(appOrigin, audit.id)}" style="color:#6d5ae6;">${normalizeDomain(audit.website_url)}</a></td>
            <td style="padding:8px 0;border-bottom:1px solid #eceef1;text-align:right;font-variant-numeric:tabular-nums;">${scoreText}</td>
          </tr>`
        })
        .join("")

      const result = await sendEmail({
        to: email,
        subject: `Your Convertly weekly digest — ${audits.length} audit${audits.length === 1 ? "" : "s"} completed`,
        html: renderEmailLayout({
          heading: "Your week in audits",
          bodyHtml: `
            <p style="margin:0 0 16px 0;">You completed ${audits.length} audit${audits.length === 1 ? "" : "s"} in the past week.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr>
                <th align="left" style="padding:0 0 8px 0;color:#8a8f99;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Website</th>
                <th align="right" style="padding:0 0 8px 0;color:#8a8f99;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Growth Score</th>
              </tr>
              ${rows}
            </table>
          `,
        }),
      })
      if (result.sent) sent += 1
      else skipped += 1
    } catch (error) {
      console.error(`email-notifications: digest failed for user ${pref.user_id}`, error)
      skipped += 1
    }
  }

  return jsonResponse({ ok: true, sent, skipped }, 200)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  if (!isEmailConfigured()) {
    // No provider key: acknowledge without sending so callers never fail.
    return jsonResponse({ ok: true, sent: false, reason: "email_not_configured" }, 200)
  }

  const url = new URL(req.url)
  const action = url.searchParams.get("action") ?? "audit_completed"

  try {
    if (action === "weekly_digest") {
      return await handleWeeklyDigest(req)
    }
    return await handleAuditCompleted(req)
  } catch (error) {
    console.error("email-notifications: unhandled error", error)
    return jsonResponse({ error: "Internal error" }, 500)
  }
})
