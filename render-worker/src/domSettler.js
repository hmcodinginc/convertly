const SETTLE_INTERVAL_MS = 200
const STABLE_SAMPLES_REQUIRED = 2

export async function waitForDomStabilization(page, maxMs) {
  const started = Date.now()

  await page
    .waitForFunction(() => document.readyState === "complete", { timeout: maxMs })
    .catch(() => {})

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
        return {
          domSettleMs: Date.now() - started,
          hydrationSettled: true,
        }
      }
    } else {
      stableSamples = 0
    }

    previous = current
  }

  return {
    domSettleMs: Date.now() - started,
    hydrationSettled: false,
  }
}

async function readDomMetrics(page) {
  return page.evaluate(() => ({
    textLength: (document.body?.innerText ?? "").replace(/\s+/g, " ").trim().length,
    elementCount: document.querySelectorAll("*").length,
  }))
}
