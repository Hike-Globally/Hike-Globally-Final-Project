/**
 * End-to-end tests for the request proxy: the redirect responses a visitor actually receives.
 *
 * `proxy()` is the real Next.js proxy function; only its data sources are injected (the rule loader
 * and the hit flusher), so these tests cover the wiring the site depends on — status codes, query
 * strings, cache behaviour, exclusions — without a server or a database.
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'

import type { RedirectionRule } from '@/lib/redirections'
import { redirectionRuntime } from '@/lib/redirections-runtime'
import { proxy } from '@/proxy'

const rule = (
  sourcePath: string,
  destinationUrl: string,
  extra: Partial<RedirectionRule> = {},
): RedirectionRule => ({
  id: sourcePath,
  sourcePath,
  destinationUrl,
  statusCode: 301,
  isActive: true,
  ...extra,
})

const request = (url: string, method = 'GET') =>
  new NextRequest(new URL(url, 'https://hikeglobally.com'), { method })

const configure = (rules: RedirectionRule[], options: { maxBatch?: number; flush?: (hits: unknown[]) => Promise<void>; onLoad?: () => void } = {}) => {
  redirectionRuntime.configure({
    loadRules: async () => {
      options.onLoad?.()
      return rules
    },
    flushHits: options.flush ?? (async () => {}),
    maxBatch: options.maxBatch,
  })
}

test('a matching rule answers 301 with the destination and the query string kept', async () => {
  configure([rule('/old-page', '/new-page')])

  const response = await proxy(request('/old-page?utm_source=newsletter&page=2'))

  assert.equal(response.status, 301)
  assert.equal(
    response.headers.get('location'),
    'https://hikeglobally.com/new-page?utm_source=newsletter&page=2',
  )
})

test('the stored status code is used for every supported code', async () => {
  for (const statusCode of [301, 302, 307, 308] as const) {
    configure([rule('/old', '/new', { statusCode })])
    const response = await proxy(request('/old'))
    assert.equal(response.status, statusCode)
  }
})

test('an external destination is redirected to as-is', async () => {
  configure([rule('/legacy', 'https://example.com/landing?ref=hg')])

  const response = await proxy(request('/legacy?x=1'))

  assert.equal(response.status, 301)
  assert.equal(response.headers.get('location'), 'https://example.com/landing?ref=hg&x=1')
})

test('matching ignores case and a trailing slash', async () => {
  configure([rule('/Old-Page/', '/new-page')])

  assert.equal((await proxy(request('/OLD-PAGE/'))).status, 301)
  assert.equal((await proxy(request('/old-page'))).status, 301)
})

test('an inactive rule serves nothing', async () => {
  configure([rule('/old', '/new', { isActive: false })])

  const response = await proxy(request('/old'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-middleware-next'), '1')
})

test('a path with no rule passes through', async () => {
  configure([rule('/old', '/new')])

  const response = await proxy(request('/trips/everest-base-camp'))
  assert.equal(response.status, 200)
})

test('admin, API, static assets and file requests never run the redirect lookup', async () => {
  let loads = 0
  configure([rule('/old', '/new')], { onLoad: () => (loads += 1) })

  for (const url of [
    '/admin',
    '/admin/collections/redirections',
    '/api/redirections',
    '/api/media/file/photo.jpg',
    '/images/logo.svg',
    '/_next/static/chunk.js',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/',
  ]) {
    const response = await proxy(request(url))
    assert.notEqual(response.status, 301, `${url} must not redirect`)
  }

  assert.equal(loads, 0, 'the rule cache is never even consulted for excluded paths')
})

test('only GET and HEAD are redirected', async () => {
  configure([rule('/old', '/new')])

  assert.equal((await proxy(request('/old', 'POST'))).status, 200)
  assert.equal((await proxy(request('/old', 'HEAD'))).status, 301)
})

test('the rule map is cached between requests and reloaded after invalidation', async () => {
  let loads = 0
  configure([rule('/old', '/new')], { onLoad: () => (loads += 1) })

  await proxy(request('/old'))
  await proxy(request('/old'))
  await proxy(request('/other'))
  assert.equal(loads, 1)

  redirectionRuntime.invalidate()
  await proxy(request('/old'))
  assert.equal(loads, 2)
})

test('a hit is counted, and a full batch is flushed off the redirect path', async () => {
  const flushed: { id: unknown; count: number }[][] = []
  configure([rule('/old', '/new', { id: 42 })], {
    maxBatch: 1,
    flush: async (hits) => {
      flushed.push(hits as { id: unknown; count: number }[])
    },
  })

  const response = await proxy(request('/old'))
  assert.equal(response.status, 301)

  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(flushed.length, 1)
  assert.deepEqual(flushed[0].map((hit) => [hit.id, hit.count]), [[42, 1]])
  assert.equal(redirectionRuntime.pendingHits(), 0)
})

test('the legacy locale prefix still 308-redirects to the same page without it', async () => {
  configure([])

  const response = await proxy(request('/de/trips'))
  assert.equal(response.status, 308)
  assert.equal(response.headers.get('location'), 'https://hikeglobally.com/trips')
})

test('a same-origin admin request keeps working with the Origin header dropped', async () => {
  configure([])

  const nextRequest = new NextRequest(new URL('/admin/collections/redirections', 'https://hikeglobally.com'), {
    headers: { origin: 'https://hikeglobally.com', host: 'hikeglobally.com' },
  })

  const response = await proxy(nextRequest)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-middleware-next'), '1')
})
