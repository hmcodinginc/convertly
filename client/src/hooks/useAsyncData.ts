import { useCallback, useEffect, useRef, useState } from "react"

import { createLogger } from "@/lib/logger"

const asyncLogger = createLogger("async")

export const USER_FACING_LOAD_ERROR = "Something went wrong. Please try again."

export type QueryStatus = "idle" | "loading" | "success" | "error" | "empty"

export type AsyncState<T> = {
  data: T | null
  error: string | null
  status: QueryStatus
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  isSuccess: boolean
  reload: (options?: { silent?: boolean }) => void
}

type UseAsyncDataOptions<T> = {
  enabled?: boolean
  isEmpty?: (data: T) => boolean
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncDataOptions<T> = {}
): AsyncState<T> {
  const { enabled = true, isEmpty: isEmptyPredicate } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<QueryStatus>("idle")
  const [reloadToken, setReloadToken] = useState(0)
  const silentReloadRef = useRef(false)

  const reload = useCallback((reloadOptions?: { silent?: boolean }) => {
    silentReloadRef.current = reloadOptions?.silent ?? false
    setReloadToken((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const silent = silentReloadRef.current
    silentReloadRef.current = false

    async function run() {
      if (!silent) {
        setStatus("loading")
        setError(null)
      }

      try {
        const result = await fetcher()
        if (cancelled) return

        const empty = isEmptyPredicate?.(result) ?? false
        setData(result)
        setStatus(empty ? "empty" : "success")
      } catch (err) {
        if (cancelled) return
        setData(null)
        asyncLogger.error("Async fetch failed", {
          message: err instanceof Error ? err.message : String(err),
        })
        setError(USER_FACING_LOAD_ERROR)
        setStatus("error")
      }
    }

    void run()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher identity controlled by caller deps
  }, [...deps, enabled, reloadToken])

  return {
    data,
    error,
    status,
    isLoading: enabled && (status === "loading" || status === "idle"),
    isError: status === "error",
    isEmpty: status === "empty",
    isSuccess: status === "success",
    reload,
  }
}
