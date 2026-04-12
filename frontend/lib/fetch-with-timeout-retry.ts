import { logger } from '@/lib/logger'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export type FetchWithTimeoutRetryOptions = {
  /** Per-attempt timeout (default 45s). */
  timeoutMs?: number
  /** Total tries including the first (default 3). */
  maxAttempts?: number
  /** Base backoff; actual delay is base * 2^(attempt-1). */
  baseDelayMs?: number
  /** Log label when retrying. */
  label?: string
}

/**
 * True for common transient outbound failures (slow networks, Google blips, local dev DNS).
 */
export function isTransientNetworkError(e: unknown): boolean {
  if (e == null || typeof e !== 'object') return false
  const err = e as Error & { cause?: unknown; code?: string }
  if (err.name === 'AbortError') return true
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') return true
  const msg = String(err.message || '')
  if (/fetch failed|network|timed out|aborted|ETIMEDOUT|ECONNRESET|ECONNREFUSED/i.test(msg)) return true
  const c = err.cause
  if (c && typeof c === 'object') {
    const cErr = c as { code?: string; message?: string; errors?: unknown[] }
    if (typeof cErr.code === 'string' && /ETIMEDOUT|ECONNRESET|ECONNREFUSED/i.test(cErr.code)) return true
    if (typeof cErr.message === 'string' && /ETIMEDOUT|ECONNRESET|ECONNREFUSED/i.test(cErr.message)) return true
    if (Array.isArray(cErr.errors)) {
      for (const sub of cErr.errors) {
        if (sub && typeof sub === 'object' && isTransientNetworkError(sub)) return true
      }
    }
    if (isTransientNetworkError(c)) return true
  }
  return false
}

/**
 * Server-side fetch with per-attempt timeout and exponential backoff on transient failures.
 * Does not retry non-OK HTTP responses (caller handles those).
 */
export async function fetchWithTimeoutRetry(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  options: FetchWithTimeoutRetryOptions = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 45_000
  const maxAttempts = options.maxAttempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 600
  const label = options.label ?? 'fetch'

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const { signal: _ignoreUserSignal, ...rest } = init || {}
      const res = await fetch(input, {
        ...rest,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return res
    } catch (e) {
      clearTimeout(timeoutId)
      lastError = e
      const transient = isTransientNetworkError(e)
      if (!transient || attempt === maxAttempts) {
        throw e
      }
      const delay = baseDelayMs * 2 ** (attempt - 1)
      logger.warn(`${label}: transient error, retrying`, {
        attempt,
        maxAttempts,
        delayMs: delay,
        error: e instanceof Error ? e.message : String(e),
      })
      await sleep(delay)
    }
  }
  throw lastError
}
