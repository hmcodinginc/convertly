/**
 * Cooperative abort for in-flight audit engine runs.
 *
 * The engine runs client-side as a fire-and-forget loop. On logout it must not
 * survive as a zombie (it would keep issuing network calls and CPU work on the
 * login page, and race the logout draft conversion). Standalone module so both
 * the engine and authService can import it without cycles.
 */

let engineEpoch = 0

export class AuditEngineAbortedError extends Error {
  constructor() {
    super("Audit engine run aborted")
    this.name = "AuditEngineAbortedError"
  }
}

/** Snapshot the current epoch at the start of an engine run. */
export function currentEngineEpoch(): number {
  return engineEpoch
}

/** Aborts all in-flight engine runs (e.g. on logout). */
export function abortAuditEngines(): void {
  engineEpoch += 1
}

/** Throws when the run's epoch is stale (an abort happened after it started). */
export function throwIfEngineAborted(runEpoch: number): void {
  if (runEpoch !== engineEpoch) {
    throw new AuditEngineAbortedError()
  }
}
