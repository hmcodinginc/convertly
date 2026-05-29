/** Simulates network latency for async service methods */
export function delay(ms = 40): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
