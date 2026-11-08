/**
 * Tests for the two pieces of the Redirections feature that are easiest to get subtly wrong: the
 * rule cache that keeps the proxy off the database, and the batched hit counter that must never slow
 * a redirect down.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import type { RedirectionRule } from '@/lib/redirections'
import {
  createRedirectionHitQueue,
  createRedirectionRulesCache,
  redirectionCacheTtlMs,
} from '@/lib/redirections-cache'

const rule = (sourcePath: string, destinationUrl = '/new'): RedirectionRule => ({
  id: sourcePath,
  sourcePath,
  destinationUrl,
  statusCode: 301,
  isActive: true,
})

/* -------------------------------------------------------------------------------------------- */
/* Rule cache                                                                                    */
/* -------------------------------------------------------------------------------------------- */

test('the rule cache serves from memory until its TTL expires', async () => {
  let now = 1_000
  let loads = 0

  const cache = createRedirectionRulesCache({
    load: async () => {
      loads += 1
      return [rule('/old')]
    },
    ttlMs: 1_000,
    now: () => now,
  })

  const first = await cache.get()
  assert.equal(loads, 1)
  assert.equal(first.byPath.size, 1)

  // Still fresh: no second load.
  now += 500
  await cache.get()
  assert.equal(loads, 1)

  // Expired: one reload.
  now += 600
  await cache.get()
  assert.equal(loads, 2)
})

test('concurrent lookups share a single in-flight load', async () => {
  let loads = 0
  const cache = createRedirectionRulesCache({
    load: async () => {
      loads += 1
      await new Promise((resolve) => setTimeout(resolve, 5))
      return [rule('/old')]
    },
  })

  await Promise.all([cache.get(), cache.get(), cache.get()])
  assert.equal(loads, 1)
})

test('invalidate() clears the cache so the next lookup reloads', async () => {
  let loads = 0
  const now = 0

  const cache = createRedirectionRulesCache({
    load: async () => {
      loads += 1
      return [rule(`/old-${loads}`)]
    },
    ttlMs: 60_000,
    now: () => now,
  })

  assert.equal((await cache.get()).byPath.has('/old-1'), true)

  cache.invalidate()
  assert.equal(cache.peek(), null)

  assert.equal((await cache.get()).byPath.has('/old-2'), true)
  assert.equal(loads, 2)
})

test('set() replaces the cache without a load (a write in this process is already fresh)', async () => {
  let loads = 0
  const cache = createRedirectionRulesCache({
    load: async () => {
      loads += 1
      return []
    },
  })

  cache.set([rule('/from-write')])
  const compiled = await cache.get()

  assert.equal(loads, 0)
  assert.equal(compiled.byPath.has('/from-write'), true)
})

test('a failed refresh serves the previous map instead of taking the site down', async () => {
  let now = 0
  let fail = false
  const errors: unknown[] = []

  const cache = createRedirectionRulesCache({
    load: async () => {
      if (fail) throw new Error('database is down')
      return [rule('/old')]
    },
    ttlMs: 10,
    now: () => now,
    onError: (error) => errors.push(error),
  })

  assert.equal((await cache.get()).byPath.has('/old'), true)

  fail = true
  now += 100

  const afterFailure = await cache.get()
  assert.equal(afterFailure.byPath.has('/old'), true, 'the last good map is still served')
  assert.equal(errors.length, 1)

  // The failure also backs the retry off for one TTL rather than hammering a broken database.
  now += 1
  await cache.get()
  assert.equal(errors.length, 1)
})

test('a cold cache with a failing loader returns an empty rule set', async () => {
  const cache = createRedirectionRulesCache({
    load: async () => {
      throw new Error('nope')
    },
  })

  const compiled = await cache.get()
  assert.equal(compiled.byPath.size, 0)
})

test('a hung loader is aborted by the timeout', async () => {
  const cache = createRedirectionRulesCache({
    load: (signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')))
      }),
    timeoutMs: 10,
  })

  const compiled = await cache.get()
  assert.equal(compiled.byPath.size, 0)
})

test('the TTL is configurable and ignores nonsense values', () => {
  assert.equal(redirectionCacheTtlMs({}), 30_000)
  assert.equal(redirectionCacheTtlMs({ REDIRECTIONS_CACHE_TTL_MS: '5000' }), 5_000)
  assert.equal(redirectionCacheTtlMs({ REDIRECTIONS_CACHE_TTL_MS: '0' }), 0)
  assert.equal(redirectionCacheTtlMs({ REDIRECTIONS_CACHE_TTL_MS: 'soon' }), 30_000)
  assert.equal(redirectionCacheTtlMs({ REDIRECTIONS_CACHE_TTL_MS: '-1' }), 30_000)
})

/* -------------------------------------------------------------------------------------------- */
/* Hit queue                                                                                     */
/* -------------------------------------------------------------------------------------------- */

test('hits accumulate in memory and flush as one batch', async () => {
  const batches: unknown[][] = []
  const queue = createRedirectionHitQueue({
    flush: async (hits) => {
      batches.push(hits)
    },
  })

  queue.record(7)
  queue.record(7)
  queue.record(9)
  assert.equal(queue.size(), 2)
  assert.equal(batches.length, 0, 'counting must not write on every request')

  await queue.flush()

  assert.equal(queue.size(), 0)
  assert.equal(batches.length, 1)
  assert.deepEqual(
    (batches[0] as { id: number; count: number }[]).map((hit) => [hit.id, hit.count]),
    [
      [7, 2],
      [9, 1],
    ],
  )
})

test('a batch is due once it reaches the size threshold', () => {
  const queue = createRedirectionHitQueue({ flush: async () => {}, maxBatch: 3 })

  queue.record(1)
  assert.equal(queue.due(), false)
  queue.record(2)
  assert.equal(queue.due(), false)
  queue.record(3)
  assert.equal(queue.due(), true)
})

test('a batch is due once it is old enough', () => {
  let now = 0
  const queue = createRedirectionHitQueue({ flush: async () => {}, maxAgeMs: 1_000, now: () => now })

  queue.record(1)
  assert.equal(queue.due(), false)

  now = 1_001
  assert.equal(queue.due(), true)
})

test('a failed flush drops the batch instead of growing without bound', async () => {
  let attempts = 0
  const errors: unknown[] = []
  const queue = createRedirectionHitQueue({
    flush: async () => {
      attempts += 1
      throw new Error('network')
    },
    onError: (error) => errors.push(error),
  })

  queue.record(1)
  await queue.flush()

  assert.equal(attempts, 1)
  assert.equal(queue.size(), 0)
  assert.equal(errors.length, 1)
})

test('flushing an empty queue does nothing', async () => {
  let calls = 0
  const queue = createRedirectionHitQueue({
    flush: async () => {
      calls += 1
    },
  })

  await queue.flush()
  assert.equal(calls, 0)
})

test('the last hit timestamp is the newest one seen for a rule', async () => {
  const batches: { id: number | string; count: number; lastHitAt: string }[][] = []
  const queue = createRedirectionHitQueue({
    flush: async (hits) => {
      batches.push(hits as never)
    },
  })

  queue.record(1, new Date('2026-11-01T10:00:00.000Z'))
  queue.record(1, new Date('2026-11-02T10:00:00.000Z'))
  queue.record(1, new Date('2026-11-01T18:00:00.000Z'))
  await queue.flush()

  assert.equal(batches[0][0].count, 3)
  assert.equal(batches[0][0].lastHitAt, '2026-11-02T10:00:00.000Z')
})
