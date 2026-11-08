/**
 * Proxy-runtime wiring for the Redirections module: the one place that knows how the cached rule
 * map is fetched and how batched hits are written back.
 *
 * Why the proxy does not talk to Postgres itself
 * ----------------------------------------------
 * The rules live in Postgres, but the request proxy runs before any route (and, on Vercel, in a
 * different runtime than the Payload app). Giving it a database driver would mean bundling the
 * whole adapter into the edge bundle, opening a pool per instance and paying TLS setup on cold
 * starts — for a table whose entire content is a handful of URL pairs. Instead the app exposes one
 * small endpoint (`GET /api/redirections/rules`) and the proxy keeps the answer in memory. One
 * request per TTL per warm instance, no driver, no schema knowledge in the proxy.
 *
 * `REDIRECTIONS_INTERNAL_SECRET` is optional: the endpoints it protects (`/rules`, `/hit`) expose
 * only public redirect targets and a counter. Set it to make the internal API callable by this
 * deployment alone (the proxy sends it automatically).
 */

import type { Payload } from 'payload'

import {
  compileRedirections,
  type CompiledRedirections,
  type RedirectionRule,
} from './redirections'
import {
  createRedirectionHitQueue,
  createRedirectionRulesCache,
  redirectionCacheTtlMs,
  type RedirectionHit,
  type RedirectionRulesCache,
  type RedirectionRulesLoader,
} from './redirections-cache'

export const REDIRECTIONS_INTERNAL_HEADER = 'x-redirections-internal'

export const redirectionsInternalSecret = (
  env: Record<string, string | undefined> = process.env,
): string => (env.REDIRECTIONS_INTERNAL_SECRET ?? '').trim()

type RulesPayload = {
  rules?: Array<{
    id?: number | string
    source?: string
    destination?: string
    statusCode?: number | string
  }>
}

/** `GET /api/redirections/rules` → the rules the proxy matches against. */
export const fetchActiveRedirections = async ({
  origin,
  signal,
  secret = redirectionsInternalSecret(),
}: {
  origin: string
  signal?: AbortSignal
  secret?: string
}): Promise<RedirectionRule[]> => {
  const url = new URL('/api/redirections/rules', origin)
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      ...(secret ? { [REDIRECTIONS_INTERNAL_HEADER]: secret } : {}),
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`redirections: /api/redirections/rules answered ${response.status}`)
  }

  const body = (await response.json()) as RulesPayload

  const rules: RedirectionRule[] = []
  for (const rule of body.rules ?? []) {
    if (rule.id === undefined || rule.id === null || !rule.source || !rule.destination) continue
    rules.push({
      id: rule.id,
      sourcePath: rule.source,
      destinationUrl: rule.destination,
      statusCode: Number(rule.statusCode) || 301,
      isActive: true,
    })
  }

  return rules
}

/** `POST /api/redirections/hit` → one batched counter update. */
export const postRedirectionHits = async ({
  origin,
  hits,
  secret = redirectionsInternalSecret(),
}: {
  origin: string
  hits: RedirectionHit[]
  secret?: string
}): Promise<void> => {
  if (hits.length === 0) return

  const response = await fetch(new URL('/api/redirections/hit', origin), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { [REDIRECTIONS_INTERNAL_HEADER]: secret } : {}),
    },
    body: JSON.stringify({ hits }),
  })

  if (!response.ok) {
    throw new Error(`redirections: /api/redirections/hit answered ${response.status}`)
  }
}

type RuntimeOverrides = {
  loadRules?: RedirectionRulesLoader
  flushHits?: (hits: RedirectionHit[]) => Promise<void>
  ttlMs?: number
  now?: () => number
  maxBatch?: number
  maxAgeMs?: number
}

const createRuntime = () => {
  // One origin per deployment; the first request that reaches the proxy sets it.
  let origin: string | null = null
  let rulesCache: RedirectionRulesCache | null = null
  let hitQueue = createRedirectionHitQueue({ flush: async () => {} })
  let overrides: RuntimeOverrides = {}

  const build = () => {
    const load: RedirectionRulesLoader =
      overrides.loadRules ??
      ((signal) => {
        if (!origin) return Promise.resolve([])
        return fetchActiveRedirections({ origin, signal })
      })

    rulesCache = createRedirectionRulesCache({
      load,
      now: overrides.now,
      ttlMs: overrides.ttlMs ?? redirectionCacheTtlMs(),
      onError: (error) =>
        console.warn(`[redirections] rule cache refresh failed — serving the previous map: ${(error as Error).message}`),
    })

    hitQueue = createRedirectionHitQueue({
      now: overrides.now,
      maxBatch: overrides.maxBatch,
      maxAgeMs: overrides.maxAgeMs,
      flush:
        overrides.flushHits ??
        ((hits) => (origin ? postRedirectionHits({ origin, hits }) : Promise.resolve())),
      onError: (error) =>
        console.warn(`[redirections] hit flush failed — counts for this batch were dropped: ${(error as Error).message}`),
    })
  }

  build()

  return {
    /** The proxy calls this with the request's own origin before its first lookup. */
    rememberOrigin: (value: string) => {
      if (!origin && value) {
        origin = value
        // A cache built before an origin existed can only have returned an empty map.
        rulesCache?.invalidate()
      }
    },
    getRules: (): Promise<CompiledRedirections> => rulesCache?.get() ?? Promise.resolve(compileRedirections([])),
    peek: (): CompiledRedirections | null => rulesCache?.peek() ?? null,
    invalidate: () => rulesCache?.invalidate(),
    setRules: (rules: RedirectionRule[]) => rulesCache?.set(rules),
    recordHit: (id: number | string) => hitQueue.record(id),
    hitsDue: () => hitQueue.due(),
    flushHits: () => hitQueue.flush(),
    pendingHits: () => hitQueue.size(),
    /** Test seam: replaces the loader/flusher and rebuilds both caches. */
    configure: (next: RuntimeOverrides = {}) => {
      overrides = next
      build()
    },
    reset: () => {
      overrides = {}
      build()
    },
  }
}

export const redirectionRuntime = createRuntime()

/**
 * Column values for a batched hit update.
 *
 * The Postgres path is one `UPDATE … FROM (VALUES …)` for the whole batch — the counter is
 * maintained next to the redirect, so this is the only write the feature performs on read traffic.
 */
export const applyRedirectionHits = async (
  payload: Payload,
  hits: RedirectionHit[],
): Promise<number> => {
  const valid = hits
    .map((hit) => ({
      id: Number(hit.id),
      count: Number.isFinite(hit.count) && hit.count > 0 ? Math.min(Math.round(hit.count), 10_000) : 0,
      at: new Date(hit.lastHitAt),
    }))
    .filter((hit) => Number.isInteger(hit.id) && hit.id > 0 && hit.count > 0 && !Number.isNaN(hit.at.getTime()))

  if (valid.length === 0) return 0

  const pool = (payload.db as unknown as { pool?: { query: (text: string, values?: unknown[]) => Promise<unknown> } })
    ?.pool

  if (pool?.query) {
    const values: unknown[] = []
    const tuples = valid.map((hit, index) => {
      values.push(hit.id, hit.count, hit.at.toISOString())
      return `($${index * 3 + 1}::int, $${index * 3 + 2}::int, $${index * 3 + 3}::timestamptz)`
    })

    await pool.query(
      `UPDATE "redirections" AS r
          SET "hit_count" = COALESCE(r."hit_count", 0) + v."count",
              "last_hit_at" = GREATEST(COALESCE(r."last_hit_at", to_timestamp(0)), v."at")
         FROM (VALUES ${tuples.join(', ')}) AS v("id", "count", "at")
        WHERE r."id" = v."id"`,
      values,
    )

    return valid.length
  }

  // Non-Postgres adapters (tests, PGlite): the local API keeps the same behaviour, slower.
  for (const hit of valid) {
    try {
      const current = await payload.findByID({
        id: hit.id,
        collection: 'redirections',
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
      })
      if (!current) continue
      await payload.update({
        id: hit.id,
        collection: 'redirections',
        data: {
          hitCount: (current.hitCount ?? 0) + hit.count,
          lastHitAt: hit.at.toISOString(),
        },
        overrideAccess: true,
        context: { skipRedirectionValidation: true },
      })
    } catch (error) {
      console.warn(`[redirections] could not record hits for #${hit.id}: ${(error as Error).message}`)
    }
  }

  return valid.length
}
