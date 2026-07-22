import type { AuditExecutionStageId } from "@/types/auditExecution"

export type AuditExecutionStageDefinition = {
  id: AuditExecutionStageId
  label: string
}

export const AUDIT_EXECUTION_STAGES: AuditExecutionStageDefinition[] = [
  { id: "preparing-workspace", label: "Preparing workspace" },
  { id: "validating-website", label: "Validating website" },
  { id: "discovering-pages", label: "Discovering pages" },
  { id: "capturing-screenshots", label: "Collecting page snapshots" },
  { id: "rendering-dom", label: "Rendering DOM" },
  { id: "detecting-navigation", label: "Detecting navigation" },
  { id: "detecting-ctas", label: "Detecting CTAs" },
  { id: "detecting-forms", label: "Detecting forms" },
  { id: "detecting-hero", label: "Detecting hero section" },
  { id: "checking-trust", label: "Checking trust signals" },
  { id: "checking-accessibility", label: "Checking accessibility" },
  { id: "running-seo", label: "Running SEO analysis" },
  { id: "running-mobile", label: "Running mobile analysis" },
  { id: "calculating-scores", label: "Calculating scores" },
  { id: "prioritizing-issues", label: "Prioritizing issues" },
  { id: "building-recommendations", label: "Building recommendations" },
  { id: "building-playbooks", label: "Building implementation playbooks" },
  { id: "finalizing-report", label: "Finalizing report" },
]

export const ANALYSIS_STAGE_IDS: AuditExecutionStageId[] = [
  "rendering-dom",
  "detecting-navigation",
  "detecting-ctas",
  "detecting-forms",
  "detecting-hero",
  "checking-trust",
  "checking-accessibility",
  "running-seo",
  "running-mobile",
]

export const POST_ANALYSIS_STAGE_IDS: AuditExecutionStageId[] = [
  "calculating-scores",
  "prioritizing-issues",
  "building-recommendations",
  "building-playbooks",
  "finalizing-report",
]

export function stageIndex(id: AuditExecutionStageId): number {
  return AUDIT_EXECUTION_STAGES.findIndex((stage) => stage.id === id)
}

export function stageLabel(id: AuditExecutionStageId): string {
  return AUDIT_EXECUTION_STAGES.find((stage) => stage.id === id)?.label ?? id
}
