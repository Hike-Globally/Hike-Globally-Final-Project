/**
 * The proxy-side cache for active redirections, and the deferred hit counter.
 *
 * A redirect lookup runs on every public page request, so it must not touch Postgres (or even the
 * network) on the common path. Two cheap layers make that true:
 *
 *   cache    one `GET /api/redirections/rules` per TTL per warm instance, compiled into a
 *            `Map<path, rule>` once. The whole table is small — it is a list of URLs — so the
 *            expensive part is the round trip, not the memory.
 *   hits     counters are accumulated in a `Map` and flushed in one batched POST, off the redirect
 *            path. A visitor gets their 301 immediately; `hit_count` catches up milliseconds later.
 *
 * Both pieces are plain factories with an injected clock and loader, so the behaviour (TTL,
 * stale-while-error, batch thresholds) is tested without a server, a database or real time.
 */

import {
  compileRedirections,
  type CompiledRedirections,
  type RedirectionRule,
} from './redirections'

export const DEFAULT_REDIRECTION_CACHE_TTL_MS = 30_000
export const DEFAULT_REDIRECTION_RULES_TIMEOUT_MS = 2_000

/** `REDIRECTIONS_CACHE_TTL_MS` — how long a warm instance may reuse its rule map. */
export const redirectionCacheTtlMs = (
  env: Record<string, string | undefined> = process.env,
): number => {
  const configured = Number(env.REDIRECTIONS_CACHE_TTL_MS)
  if (!Number.isFinite(configured) || configured < 0) return DEFAULT_REDIRECTION_CACHE_TTL_MS
  return configured
}

export type RedirectionRulesLoader = (signal?: AbortSignal) => Promise<RedirectionRule[]>

export type RedirectionRulesCache = {
  /** Current compiled rules, refreshing from the loader when stale or cold. */
  get: () => Promise<CompiledRedirections>
  /** What is in memory right now (used by tests and diagnostics). */
  peek: () => CompiledRedirections | null
  /** Replaces the cache contents (a write in this process has just changed the table). */
  set: (rules: RedirectionRule[]) => void
  /** Drops the cache; the next `get()` reloads. */
  invalidate: () => void
  /** Milliseconds until the cached copy goes stale (0 when there is no cache). */
  age: () => number
}

const emptyCompiled = (): CompiledRedirections => compileRedirections([])

export const createRedirectionRulesCache = ({
  load,
  ttlMs = DEFAULT_REDIRECTION_CACHE_TTL_MS,
  timeoutMs = DEFAULT_REDIRECTION_RULES_TIMEOUT_MS,
  now = () => Date.now(),
  onError,
}: {
  load: RedirectionRulesLoader
  ttlMs?: number
  timeoutMs?: number
  now?: () => number
  onError?: (error: unknown) => void
}): RedirectionRulesCache => {
  let cached: { compiled: CompiledRedirections; loadedAt: number } | null = null
  let inflight: Promise<CompiledRedirections> | null = null

  const loadWithTimeout = async (): Promise<CompiledRedirections> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const rules = await load(controller.signal)
      return compileRedirections(Array.isArray(rules) ? rules : [])
    } finally {
      clearTimeout(timer)
    }
  }

  const get = async (): Promise<CompiledRedirections> => {
    if (cached && now() - cached.loadedAt < ttlMs) return cached.compiled
    if (inflight) return inflight

    inflight = (async () => {
      try {
        const compiled = await loadWithTimeout()
        cached = { compiled, loadedAt: now() }
        return compiled
      } catch (error) {
        // A redirect lookup must never take the site down. A stale map (which may only be missing
        // rules added in the last few seconds) is a better answer than an error page.
        onError?.(error)
        if (cached) {
          cached = { ...cached, loadedAt: now() }
          return cached.compiled
        }
        return emptyCompiled()
      } finally {
        inflight = null
      }
    })()

    return inflight
  }

  return {
    get,
    peek: () => cached?.compiled ?? null,
    set: (rules) => {
      cached = { compiled: compileRedirections(rules), loadedAt: now() }
    },
    invalidate: () => {
      cached = null
    },
    age: () => (cached ? now() - cached.loadedAt : 0),
  }
}

export type RedirectionHit = {
  id: number | string
  count: number
  lastHitAt: string
}

export type RedirectionHitFlush = (hits: RedirectionHit[]) => Promise<void>

export type RedirectionHitQueue = {
  /** Count one served redirect. Synchronous and allocation-light: this is the redirect path. */
  record: (id: number | string, at?: Date) => void
  /** True when a batch is worth sending now (enough entries, or old enough). */
  due: () => boolean
  /** Sends everything pending in one request. Never throws. */
  flush: () => Promise<void>
  size: () => number
}

/**
 * Batched hit counter.
 *
 * Deliberately *lossy on failure*: if the flush request dies, the batch is dropped rather than
 * requeued, because an unbounded queue in a per-request runtime is a memory leak and hit counts are
 * analytics, not accounting. The maximum a visitor can "lose" is one batch of counts.
 */
export const createRedirectionHitQueue = ({
  flush,
  now = () => Date.now(),
  maxBatch = 20,
  maxAgeMs = 15_000,
  onError,
}: {
  flush: RedirectionHitFlush
  now?: () => number
  maxBatch?: number
  maxAgeMs?: number
  onError?: (error: unknown) => void
}): RedirectionHitQueue => {
  const pending = new Map<string, { id: number | string; count: number; lastHitAt: number }>()
  let firstRecordedAt: number | null = null
  let sending: Promise<void> | null = null

  const batch = (): RedirectionHit[] => {
    const hits: RedirectionHit[] = []
    for (const entry of pending.values()) {
      hits.push({
        id: entry.id,
        count: entry.count,
        lastHitAt: new Date(entry.lastHitAt).toISOString(),
      })
    }
    pending.clear()
    firstRecordedAt = null
    return hits
  }

  return {
    record: (id, at = new Date()) => {
      if (id === undefined || id === null) return
      const key = String(id)
      const existing = pending.get(key)
      if (existing) {
        existing.count += 1
        existing.lastHitAt = Math.max(existing.lastHitAt, at.getTime())
        return
      }
      if (firstRecordedAt === null) firstRecordedAt = now()
      pending.set(key, { id, count: 1, lastHitAt: at.getTime() })
    },

    due: () => {
      if (pending.size === 0) return false
      if (pending.size >= maxBatch) return true
      return firstRecordedAt !== null && now() - firstRecordedAt >= maxAgeMs
    },

    flush: async () => {
      if (sending) return sending
      if (pending.size === 0) return

      const hits = batch()
      sending = (async () => {
        try {
          await flush(hits)
        } catch (error) {
          onError?.(error)
        } finally {
          sending = null
        }
      })()

      return sending
    },

    size: () => pending.size,
  }
}
