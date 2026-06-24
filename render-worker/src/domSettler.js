const SETTLE_INTERVAL_MS = 200
const STABLE_SAMPLES_REQUIRED = 2

export async function waitForDomStabilization(page, maxMs) {
  const started = Date.now()
  let previous = await readDomMetrics(page)
  let stableSamples = 0

  while (Date.now() - started < maxMs) {
    await page.waitForTimeout(SETTLE_INTERVAL_MS)
    const current = await readDomMetrics(page)

    const textStable = current.textLength === previous.textLength
    const elementsStable = current.elementCount === previous.elementCount

    if (textStable && elementsStable) {
      stableSamples += 1
      if (stableSamples >= STABLE_SAMPLES_REQUIRED) {
        return Date.now() - started
      }
    } else {
      stableSamples = 0
    }

    previous = current
  }

  return Date.now() - started
}

async function readDomMetrics(page) {
  return page.evaluate(() => ({
    textLength: (document.body?.innerText ?? "").replace(/\s+/g, " ").trim().length,
    elementCount: document.querySelectorAll("*").length,
  }))
}
