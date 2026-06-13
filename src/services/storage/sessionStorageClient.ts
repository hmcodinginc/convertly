function getItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function setItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

function removeItem(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

function getJson<T>(key: string, fallback: T): T {
  const raw = getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function setJson<T>(key: string, value: T): void {
  setItem(key, JSON.stringify(value))
}

export { getItem, getJson, removeItem, setItem, setJson }
