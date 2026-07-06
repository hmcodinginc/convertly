import { createLogger, isAuditDebugEnabled } from "@/lib/logger"

const staticLogger = createLogger("static")
const qualityLogger = createLogger("quality")
const playwrightLogger = createLogger("playwright")
const pipelineLogger = createLogger("pipeline")
const discoveryLogger = createLogger("discovery")

export function logStatic(message: string, data?: Record<string, unknown>): void {
  if (!isAuditDebugEnabled()) return
  staticLogger.debug(message, data)
}

export function logQuality(message: string, data?: Record<string, unknown>): void {
  if (!isAuditDebugEnabled()) return
  qualityLogger.debug(message, data)
}

export function logPlaywright(message: string, data?: Record<string, unknown>): void {
  if (!isAuditDebugEnabled()) return
  playwrightLogger.debug(message, data)
}

export function logPipeline(message: string, data?: Record<string, unknown>): void {
  if (!isAuditDebugEnabled()) return
  pipelineLogger.debug(message, data)
}

export function logDiscovery(message: string, data?: Record<string, unknown>): void {
  if (!isAuditDebugEnabled()) return
  discoveryLogger.debug(message, data)
}
