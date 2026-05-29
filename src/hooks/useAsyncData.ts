import { useCallback, useEffect, useState } from "react"

export type QueryStatus = "idle" | "loading" | "success" | "error" | "empty"

export type AsyncState<T> = {
  data: T | null
  error: string | null
  status: QueryStatus
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  isSuccess: boolean
  reload: () => void
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

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setStatus("idle")
      return
    }

    let cancelled = false

    async function run() {
      setStatus("loading")
      setError(null)
      try {
        const result = await fetcher()
        if (cancelled) return

        const empty = isEmptyPredicate?.(result) ?? false
        setData(result)
        setStatus(empty ? "empty" : "success")
      } catch (err) {
        if (cancelled) return
        setData(null)
        setError(err instanceof Error ? err.message : "Something went wrong")
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
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    isEmpty: status === "empty",
    isSuccess: status === "success",
    reload,
  }
}
