import { getConfidenceDisplayLabel } from "@/features/audits/utils/confidencePresentation"
import { getAuditStatusLabel } from "@/lib/auditStatus"
import type { AuditDetail, Issue, Recommendation, ScoreBreakdownItem } from "@/types/audit"
import type { jsPDF } from "jspdf"

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_X = 16
const MARGIN_TOP = 18
const MARGIN_BOTTOM = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
const CONTENT_BOTTOM = PAGE_HEIGHT - MARGIN_BOTTOM
const COLUMN_GAP = 6
const TWO_COL_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2

type RGB = [number, number, number]
type PdfLayout = { y: number }
type GridCard = {
  height: number
  draw: (doc: jsPDF, x: number, y: number, width: number, rowHeight?: number) => void
}

const COLORS: Record<string, RGB> = {
  bg: [9, 10, 16],
  surface: [17, 19, 28],
  surface2: [23, 26, 38],
  surface3: [28, 32, 46],
  ink: [243, 244, 248],
  muted: [142, 148, 165],
  accent: [122, 108, 255],
  accentSoft: [170, 157, 255],
  accentDim: [50, 44, 102],
  border: [42, 46, 64],
  white: [255, 255, 255],
  danger: [239, 68, 68],
  warning: [245, 158, 11],
  success: [34, 197, 94],
  neutral: [96, 165, 250],
  dangerBg: [57, 21, 27],
  warningBg: [63, 41, 12],
  successBg: [15, 54, 33],
  neutralBg: [24, 38, 66],
}

function drawPageBackground(doc: jsPDF): void {
  doc.setFillColor(...COLORS.bg)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F")
}

function addPage(doc: jsPDF): void {
  doc.addPage()
  drawPageBackground(doc)
}

function ensureSpace(doc: jsPDF, layout: PdfLayout, height: number): void {
  if (layout.y + height <= CONTENT_BOTTOM) return
  addPage(doc)
  layout.y = MARGIN_TOP
}

function drawTopBar(doc: jsPDF, auditName?: string): void {
  doc.setFillColor(...COLORS.accent)
  doc.rect(0, 0, PAGE_WIDTH, 8.5, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.white)
  doc.text("CONVERTLY", MARGIN_X, 5.6)
  if (auditName) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(230, 226, 255)
    doc.text(auditName, PAGE_WIDTH - MARGIN_X, 5.6, { align: "right", maxWidth: 90 })
  }
}

function drawSectionEyebrow(doc: jsPDF, x: number, y: number, label: string): void {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.accentSoft)
  doc.text(label.toUpperCase(), x, y)
}

function drawHero(doc: jsPDF, layout: PdfLayout, audit: AuditDetail): void {
  const heroHeight = 50
  ensureSpace(doc, layout, heroHeight)
  drawTopBar(doc)

  const heroY = 14
  const leftWidth = 108
  const rightX = MARGIN_X + leftWidth + 8
  const rightWidth = PAGE_WIDTH - MARGIN_X - rightX

  drawSectionEyebrow(doc, MARGIN_X, heroY + 3, "Conversion intelligence report")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(...COLORS.ink)
  const titleLines = doc.splitTextToSize(audit.name, leftWidth)
  doc.text(titleLines, MARGIN_X, heroY + 10)

  const metaParts = [
    audit.websiteUrl ?? audit.domain,
    audit.completedAtDate ?? audit.completedAt,
    `${audit.pagesAnalyzed} pages analyzed`,
    getAuditStatusLabel(audit.status),
  ]
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...COLORS.muted)
  doc.text(metaParts.join("  ·  "), MARGIN_X, heroY + 20 + (titleLines.length - 1) * 5, {
    maxWidth: leftWidth,
  })

  const chipY = heroY + 28 + (titleLines.length - 1) * 5
  const chips = [
    `${audit.stats.totalFindings} findings`,
    `${audit.recommendations.length} recommendations`,
    audit.runMetadata.auditConfidence != null
      ? `${audit.runMetadata.auditConfidence}% ${getConfidenceDisplayLabel(audit.runMetadata) ?? "confidence"}`
      : null,
  ].filter(Boolean) as string[]

  let chipX = MARGIN_X
  for (const chip of chips) {
    const w = Math.min(54, doc.getTextWidth(chip) + 9)
    doc.setFillColor(...COLORS.surface2)
    doc.roundedRect(chipX, chipY, w, 7, 3.5, 3.5, "F")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.ink)
    doc.text(chip, chipX + 4.5, chipY + 4.6)
    chipX += w + 3
  }

  doc.setFillColor(...COLORS.surface)
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(rightX, heroY + 2, rightWidth, 31, 4, 4, "FD")
  doc.setFillColor(...COLORS.accent)
  doc.rect(rightX, heroY + 2, 3.2, 31, "F")

  const scoreTextX = rightX + 8
  const copyX = rightX + 34
  const copyWidth = rightWidth - 38

  doc.setFont("helvetica", "bold")
  doc.setFontSize(30)
  doc.setTextColor(...COLORS.accentSoft)
  doc.text(String(audit.overallScore), scoreTextX, heroY + 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(5.8)
  doc.setTextColor(...COLORS.muted)
  doc.text("Engine Convertly V1", scoreTextX, heroY + 26)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(...COLORS.ink)
  doc.text("Growth Score", copyX, heroY + 11.5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.8)
  doc.setTextColor(...COLORS.muted)
  const subtitleLines = doc.splitTextToSize("Premium conversion report snapshot", copyWidth).slice(0, 2)
  doc.text(subtitleLines, copyX, heroY + 16.5)

  let metaY = heroY + 16.5 + subtitleLines.length * 3.4 + 1.5
  const potential = audit.runMetadata.growthPotential
  if (potential != null) {
    doc.setFillColor(...COLORS.accentSoft)
    doc.rect(copyX, metaY + 0.8, 1.5, 1.5, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.6)
    doc.setTextColor(...COLORS.accentSoft)
    doc.text(`Potential ${potential}`, copyX + 4, metaY + 2.8, { maxWidth: copyWidth - 4 })
    metaY += 3.8
  }

  const ceiling = audit.runMetadata.scoreCeiling
  if (ceiling != null && ceiling < 94) {
    doc.setFillColor(...COLORS.warning)
    doc.rect(copyX, metaY + 0.8, 1.5, 1.5, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.6)
    doc.setTextColor(...COLORS.warning)
    doc.text(`Ceiling ${ceiling}`, copyX + 4, metaY + 2.8, { maxWidth: copyWidth - 4 })
  }

  layout.y = heroY + heroHeight
}

function drawExecutiveSummary(doc: jsPDF, layout: PdfLayout, audit: AuditDetail): void {
  const categories = audit.scoreBreakdown.slice(0, 3).map((c) => c.label)
  const topRecCount = audit.recommendations.filter(
    (r) => r.priority === "Critical" || r.priority === "High"
  ).length

  // Deterministic executive summary (no AI; only existing data).
  const p1 = `This audit analyzed ${audit.pagesAnalyzed} page${audit.pagesAnalyzed === 1 ? "" : "s"} and identified ${audit.stats.totalFindings} finding${audit.stats.totalFindings === 1 ? "" : "s"} across the website.`
  const p2 = `The strongest opportunity areas are ${categories.join(", ")}.`
  const p3 = `Addressing the highest-priority recommendations (${topRecCount} item${topRecCount === 1 ? "" : "s"}) can improve overall website quality and conversion performance.`

  const p1Lines = doc.splitTextToSize(p1, CONTENT_WIDTH - 22)
  const p2Lines = doc.splitTextToSize(p2, CONTENT_WIDTH - 22)
  const p3Lines = doc.splitTextToSize(p3, CONTENT_WIDTH - 22)
  const cardH = 38 + (p1Lines.length + p2Lines.length + p3Lines.length) * 3.9 + 2.2 * 3
  ensureSpace(doc, layout, cardH)

  doc.setFillColor(...COLORS.surface2)
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(MARGIN_X, layout.y, CONTENT_WIDTH, cardH - 4, 4, 4, "FD")

  const padX = MARGIN_X + 6
  let y = layout.y + 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.ink)
  doc.text("Executive Summary", padX, y)
  y += 6

  const paragraphs = [p1, p2, p3]
  for (const paragraph of paragraphs) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.4)
    doc.setTextColor(...COLORS.muted)
    const lines = doc.splitTextToSize(paragraph, CONTENT_WIDTH - 22)
    doc.text(lines, padX, y)
    y += lines.length * 3.9 + 2.2
  }

  layout.y += cardH
}

function drawMetricCards(
  doc: jsPDF,
  layout: PdfLayout,
  metrics: Array<{ label: string; value: string; tone?: "accent" | "neutral" }>
): void {
  ensureSpace(doc, layout, 21)
  const gap = 4
  const cardWidth = (CONTENT_WIDTH - gap * 3) / 4
  const cardHeight = 19

  metrics.slice(0, 4).forEach((metric, index) => {
    const x = MARGIN_X + index * (cardWidth + gap)
    doc.setFillColor(...COLORS.surface2)
    doc.setDrawColor(...COLORS.border)
    doc.roundedRect(x, layout.y, cardWidth, cardHeight, 3, 3, "FD")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted)
    doc.text(metric.label.toUpperCase(), x + 4, layout.y + 6.2)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(13.5)
    doc.setTextColor(...(metric.tone === "accent" ? COLORS.accentSoft : COLORS.ink))
    doc.text(metric.value, x + 4, layout.y + 13.7)
  })

  layout.y += cardHeight + 7
}

function drawSectionTitle(doc: jsPDF, layout: PdfLayout, title: string, description?: string): void {
  ensureSpace(doc, layout, description ? 14 : 10)
  drawSectionEyebrow(doc, MARGIN_X, layout.y, title)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12.5)
  doc.setTextColor(...COLORS.ink)
  doc.text(title, MARGIN_X, layout.y + 6)
  if (description) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(description, MARGIN_X, layout.y + 11, { maxWidth: CONTENT_WIDTH })
    layout.y += 15
  } else {
    layout.y += 10
  }
}

function statusColors(status: string): { fill: RGB; bg: RGB } {
  const key = status.toLowerCase()
  if (key.includes("critical")) return { fill: COLORS.danger, bg: COLORS.dangerBg }
  if (key.includes("high") || key.includes("at risk")) return { fill: COLORS.warning, bg: COLORS.warningBg }
  if (key.includes("strong") || key.includes("healthy") || key.includes("completed")) {
    return { fill: COLORS.success, bg: COLORS.successBg }
  }
  return { fill: COLORS.neutral, bg: COLORS.neutralBg }
}

function drawBadge(doc: jsPDF, x: number, y: number, label: string, fill: RGB, text: RGB = COLORS.white): number {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  const width = doc.getTextWidth(label.toUpperCase()) + 8
  doc.setFillColor(...fill)
  doc.roundedRect(x, y, width, 5.4, 2.7, 2.7, "F")
  doc.setTextColor(...text)
  doc.text(label.toUpperCase(), x + width / 2, y + 3.65, { align: "center" })
  return width
}

function drawBar(doc: jsPDF, x: number, y: number, width: number, score: number): void {
  doc.setFillColor(...COLORS.border)
  doc.roundedRect(x, y, width, 2.6, 1.3, 1.3, "F")
  const fill = Math.max(0, Math.min(width, (width * score) / 100))
  if (fill > 0) {
    doc.setFillColor(...COLORS.accent)
    doc.roundedRect(x, y, fill, 2.6, 1.3, 1.3, "F")
  }
}

function drawUniformRowGrid(
  doc: jsPDF,
  layout: PdfLayout,
  cards: GridCard[],
  gap = 5,
  auditName?: string
): void {
  if (cards.length === 0) return

  for (let index = 0; index < cards.length; index += 2) {
    const left = cards[index]!
    const right = cards[index + 1]
    const rowHeight = right ? Math.max(left.height, right.height) : left.height

    if (layout.y + rowHeight > CONTENT_BOTTOM) {
      addPage(doc)
      drawTopBar(doc, auditName ?? "Convertly export")
      layout.y = MARGIN_TOP
    }

    left.draw(doc, MARGIN_X, layout.y, TWO_COL_WIDTH, rowHeight)
    if (right) {
      right.draw(doc, MARGIN_X + TWO_COL_WIDTH + COLUMN_GAP, layout.y, TWO_COL_WIDTH, rowHeight)
    }

    layout.y += rowHeight + gap
  }

  layout.y += 1
}

function drawBalancedGrid(
  doc: jsPDF,
  layout: PdfLayout,
  cards: GridCard[],
  columnCount: 2 | 1 = 2,
  gap = 5,
  auditName?: string
): void {
  if (cards.length === 0) return

  if (columnCount === 1) {
    for (const card of cards) {
      ensureSpace(doc, layout, card.height)
      card.draw(doc, MARGIN_X, layout.y, CONTENT_WIDTH)
      layout.y += card.height + gap
    }
    layout.y += 2
    return
  }

  drawUniformRowGrid(doc, layout, cards, gap, auditName)
}

function scoreBreakdownCards(items: ScoreBreakdownItem[]): GridCard[] {
  return items.map((item) => ({
    height: 26,
    draw(doc, x, y, width, rowHeight = 26) {
      doc.setFillColor(...COLORS.surface2)
      doc.setDrawColor(...COLORS.border)
      doc.roundedRect(x, y, width, rowHeight, 3, 3, "FD")

      const tone = statusColors(item.status)
      drawBadge(doc, x + 4, y + 4, item.status, tone.bg, tone.fill)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(9.4)
      doc.setTextColor(...COLORS.ink)
      doc.text(item.label, x + 4, y + 15.5)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(13.5)
      doc.setTextColor(...COLORS.accentSoft)
      doc.text(String(item.score), x + width - 4, y + 15.5, { align: "right" })

      drawBar(doc, x + 4, y + rowHeight - 5.5, width - 8, item.score)
    },
  }))
}

function pageCards(audit: AuditDetail): GridCard[] {
  return audit.pageFindings.slice(0, 12).map((page) => ({
    height: 29,
    draw(doc, x, y, width, rowHeight = 29) {
      doc.setFillColor(...COLORS.surface2)
      doc.setDrawColor(...COLORS.border)
      doc.roundedRect(x, y, width, rowHeight, 3, 3, "FD")

      const status = statusColors(page.status)
      // Hierarchy: Score -> Severity -> Issue count -> Page name -> URL
      drawBadge(doc, x + 4, y + 4, page.status, status.bg, status.fill)
      if (page.pageType) {
        const typeWidth = doc.getTextWidth(page.pageType.toUpperCase()) + 8
        const scoreBlockStart = width - 24
        const typeX = Math.min(x + 4 + 28, x + scoreBlockStart - typeWidth - 4)
        drawBadge(doc, typeX, y + 4, page.pageType, COLORS.surface3, COLORS.muted)
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(13)
      doc.setTextColor(...COLORS.accentSoft)
      doc.text(String(page.score), x + width - 4, y + 10, { align: "right" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.muted)
      doc.text(`${page.issuesCount} issues`, x + width - 4, y + 16.6, { align: "right" })

      const nameLines = doc.splitTextToSize(page.label, width - 10).slice(0, 2)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.7)
      doc.setTextColor(...COLORS.ink)
      doc.text(nameLines, x + 4, y + 18)

      const urlText = (page.url ?? page.path).trim()
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.muted)
      const urlLines = doc.splitTextToSize(urlText, width - 8).slice(0, 1)
      doc.text(urlLines, x + 4, y + 24.8)
    },
  }))
}

function measureFindingCardHeight(
  doc: jsPDF,
  title: string,
  detail: string,
  compactMeta: string | undefined,
  width: number
): number {
  const titleLines = doc.splitTextToSize(title, width - 10).slice(0, 3)
  const metaLines = compactMeta ? doc.splitTextToSize(compactMeta, width - 10).slice(0, 2) : []
  const detailLines = doc.splitTextToSize(detail, width - 10).slice(0, 4)
  return (
    18 +
    titleLines.length * 4.8 +
    metaLines.length * 4.2 +
    detailLines.length * 4.1 +
    (metaLines.length > 0 ? 2 : 0)
  )
}

function findingCard(
  doc: jsPDF,
  severity: string,
  title: string,
  detail: string,
  width: number,
  compactMeta?: string
): GridCard {
  const height = measureFindingCardHeight(doc, title, detail, compactMeta, width)

  return {
    height,
    draw(drawDoc, x, y, cardWidth, rowHeight = height) {
      const titleLines = drawDoc.splitTextToSize(title, cardWidth - 10).slice(0, 3)
      const metaLines = compactMeta
        ? drawDoc.splitTextToSize(compactMeta, cardWidth - 10).slice(0, 2)
        : []
      const detailLines = drawDoc.splitTextToSize(detail, cardWidth - 10).slice(0, 4)
      const tone = statusColors(severity)

      drawDoc.setFillColor(...COLORS.surface2)
      drawDoc.setDrawColor(...COLORS.border)
      drawDoc.roundedRect(x, y, cardWidth, rowHeight, 3, 3, "FD")
      drawDoc.setFillColor(...tone.fill)
      drawDoc.rect(x, y, 2.5, rowHeight, "F")
      drawBadge(drawDoc, x + 4, y + 4, severity, tone.fill, COLORS.white)

      let cursorY = y + 15.5
      drawDoc.setFont("helvetica", "bold")
      drawDoc.setFontSize(9.3)
      drawDoc.setTextColor(...COLORS.ink)
      drawDoc.text(titleLines, x + 5, cursorY)
      cursorY += titleLines.length * 4.8 + 1.2

      if (metaLines.length > 0) {
        drawDoc.setDrawColor(...COLORS.border)
        drawDoc.setLineWidth(0.25)
        drawDoc.line(x + 5, cursorY, x + cardWidth - 5, cursorY)
        cursorY += 2.8
        drawDoc.setFont("helvetica", "bold")
        drawDoc.setFontSize(7.2)
        drawDoc.setTextColor(...COLORS.accentSoft)
        drawDoc.text(metaLines, x + 5, cursorY)
        cursorY += metaLines.length * 4.2 + 1.4
      }

      drawDoc.setFont("helvetica", "normal")
      drawDoc.setFontSize(7.7)
      drawDoc.setTextColor(...COLORS.muted)
      drawDoc.text(detailLines, x + 5, cursorY)
    },
  }
}

function drawFooter(doc: jsPDF, audit: AuditDetail): void {
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    if (page > 1) drawTopBar(doc, audit.name)
    doc.setDrawColor(...COLORS.border)
    doc.line(MARGIN_X, PAGE_HEIGHT - 9.5, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 9.5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.8)
    doc.setTextColor(...COLORS.muted)
    doc.setTextColor(...COLORS.ink)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6.6)
    doc.text("Generated by Convertly AI Conversion Intelligence", MARGIN_X, PAGE_HEIGHT - 5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.8)
    doc.setTextColor(...COLORS.muted)
    doc.text("convertly.app", PAGE_WIDTH / 2, PAGE_HEIGHT - 5, { align: "center" })
    doc.text(`Page ${page} of ${pages}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 5, { align: "right" })
  }
}

export async function buildPdfReport(audit: AuditDetail): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const layout: PdfLayout = { y: MARGIN_TOP }

  drawPageBackground(doc)
  drawHero(doc, layout, audit)

  drawExecutiveSummary(doc, layout, audit)

  drawMetricCards(doc, layout, [
    { label: "Findings", value: String(audit.stats.totalFindings) },
    { label: "Recommendations", value: String(audit.recommendations.length) },
    { label: "Pages analyzed", value: String(audit.pagesAnalyzed) },
    {
      label: "Confidence",
      value:
        audit.runMetadata.auditConfidence != null
          ? `${audit.runMetadata.auditConfidence}%`
          : "—",
      tone: "accent",
    },
  ])

  drawSectionTitle(
    doc,
    layout,
    "Score breakdown",
    "Existing audit scores, repackaged into a denser client-friendly view."
  )
  drawBalancedGrid(doc, layout, scoreBreakdownCards(audit.scoreBreakdown), 2, 5, audit.name)

  drawSectionTitle(
    doc,
    layout,
    "Page analysis",
    "Key pages with score, issue count, status, and page type using existing report data only."
  )
  drawBalancedGrid(doc, layout, pageCards(audit), 2, 5, audit.name)

  if (audit.pageFindings.length > 12) {
    ensureSpace(doc, layout, 8)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.muted)
    doc.text(`+ ${audit.pageFindings.length - 12} more pages included in-app`, MARGIN_X, layout.y)
    layout.y += 8
  }

  drawSectionTitle(
    doc,
    layout,
    "Prioritized issues",
    "Highest-impact findings formatted as compact cards for easier scanning."
  )
  const issueCards = audit.issues
    .slice(0, 12)
    .map((issue: Issue) =>
      findingCard(
        doc,
        issue.severity,
        issue.issue,
        issue.impact,
        TWO_COL_WIDTH,
        issue.page ? `Affected page ${issue.page}` : issue.category
      )
    )
  drawBalancedGrid(doc, layout, issueCards, 2, 6, audit.name)

  if (audit.siteFindings.length > 0) {
    drawSectionTitle(doc, layout, "Site-wide findings", "Issues affecting the broader site experience.")
    const siteCards = audit.siteFindings
      .slice(0, 6)
      .map((finding) =>
        findingCard(doc, finding.severity, finding.issue, finding.impact, TWO_COL_WIDTH)
      )
    drawBalancedGrid(doc, layout, siteCards, 2, 6, audit.name)
  }

  if (audit.recommendations.length > 0) {
    drawSectionTitle(
      doc,
      layout,
      "Recommendations",
      "Actionable changes ordered for fast triage and client readability."
    )
    const recCards = audit.recommendations
      .slice(0, 8)
      .map((rec: Recommendation) =>
        findingCard(doc, rec.priority, rec.title, rec.summary, TWO_COL_WIDTH, rec.estimatedLift)
      )
    drawBalancedGrid(doc, layout, recCards, 2, 6, audit.name)
  }

  drawFooter(doc, audit)
  return doc.output("blob")
}
