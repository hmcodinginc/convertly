import { createLogger } from "@/lib/logger"
import { captureMonitoredError } from "@/lib/monitoring"

const toastLogger = createLogger("toast")

export type ToastVariant = "error" | "success" | "info"

export type ToastMessage = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

type ToastListener = (messages: ToastMessage[]) => void

const TOAST_DURATION_MS = 5_500
let toasts: ToastMessage[] = []
const listeners = new Set<ToastListener>()

function emit(): void {
  for (const listener of listeners) {
    listener(toasts)
  }
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener)
  listener(toasts)
  return () => {
    listeners.delete(listener)
  }
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id)
  emit()
}

export function showToast(input: {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}): string {
  const id = crypto.randomUUID()
  const toast: ToastMessage = {
    id,
    title: input.title,
    description: input.description,
    variant: input.variant ?? "info",
  }

  toasts = [...toasts, toast]
  emit()

  window.setTimeout(() => dismissToast(id), input.durationMs ?? TOAST_DURATION_MS)
  return id
}

export function showErrorToast(title: string, error: unknown): void {
  toastLogger.error(title, {
    error: error instanceof Error ? error.message : String(error),
  })
  captureMonitoredError(error, { toastTitle: title })
  showToast({
    variant: "error",
    title,
    description: "Please try again. If the problem persists, contact support.",
  })
}
