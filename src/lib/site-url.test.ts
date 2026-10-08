/**
 * Regression tests for site URL normalization.
 *
 * The bug this guards: `NEXT_PUBLIC_SITE_URL=hikeglobally.com` (no scheme) reached `new URL()` in
 * `src/app/(frontend)/layout.tsx` and threw `TypeError: Invalid URL`, failing `next build`
 * during prerender. Every site-URL consumer is expected to go through this module from now on.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_SITE_URL,
  normalizeSiteUrl,
  resolveSiteUrl,
  resolveSiteUrlObject,
} from './site-url'

const cases: Array<[string, string]> = [
  // The production bug: a bare host must be repaired, not thrown on.
  ['hikeglobally.com', 'https://hikeglobally.com'],
  ['hikeglobally.com/', 'https://hikeglobally.com'],
  ['www.hikeglobally.com', 'https://www.hikeglobally.com'],
  ['//hikeglobally.com', 'https://hikeglobally.com'],
  // Already-correct values pass through untouched (paths, ports, casing).
  ['https://hikeglobally.com', 'https://hikeglobally.com'],
  ['https://hikeglobally.com/', 'https://hikeglobally.com'],
  ['https://hikeglobally.com/app/', 'https://hikeglobally.com/app'],
  ['https://HIKEGLOBALLY.COM', 'https://hikeglobally.com'],
  ['https://hikeglobally.com:443', 'https://hikeglobally.com'],
  // Local hosts must not be guessed as https.
  ['localhost', 'http://localhost'],
  ['localhost:3000', 'http://localhost:3000'],
  ['http://127.0.0.1:3000', 'http://127.0.0.1:3000'],
  ['app.localhost:3000', 'http://app.localhost:3000'],
]

test('normalizeSiteUrl repairs and preserves site URLs', () => {
  for (const [input, expected] of cases) {
    assert.equal(normalizeSiteUrl(input), expected, `input: ${input}`)
    // The whole point: the result must always be parseable by `new URL()`.
    assert.doesNotThrow(() => new URL(normalizeSiteUrl(input)))
  }
})

test('normalizeSiteUrl falls back for unusable values', () => {
  for (const input of ['', '   ', 'not a url!!', 'postgres://user:pass@host:5432/db', 'ftp://x']) {
    assert.equal(normalizeSiteUrl(input), DEFAULT_SITE_URL, `input: ${input}`)
  }
  assert.doesNotThrow(() => new URL(normalizeSiteUrl('not a url!!')))
})

test('normalizeSiteUrl honours an explicit fallback', () => {
  assert.equal(normalizeSiteUrl('', 'https://example.com'), 'https://example.com')
})

test('resolveSiteUrl prefers NEXT_PUBLIC_SITE_URL over the Vercel host', () => {
  const env = {
    NEXT_PUBLIC_SITE_URL: 'hikeglobally.com',
    VERCEL_PROJECT_PRODUCTION_URL: 'hg.vercel.app',
    VERCEL_URL: 'hg-git-main.vercel.app',
  }

  assert.equal(resolveSiteUrl(env), 'https://hikeglobally.com')
})

test('resolveSiteUrl derives an https origin from the Vercel host', () => {
  const env = { VERCEL_PROJECT_PRODUCTION_URL: 'hg.vercel.app' }
  assert.equal(resolveSiteUrl(env), 'https://hg.vercel.app')

  const preview = { VERCEL_URL: 'hg-git-main.vercel.app' }
  assert.equal(resolveSiteUrl(preview), 'https://hg-git-main.vercel.app')
})

test('resolveSiteUrl falls back to a local URL when nothing is configured', () => {
  assert.equal(resolveSiteUrl({}), DEFAULT_SITE_URL)
})

test('resolveSiteUrlObject returns a URL, never throws', () => {
  const object = resolveSiteUrlObject({ NEXT_PUBLIC_SITE_URL: 'hikeglobally.com' })
  assert.equal(object?.origin, 'https://hikeglobally.com')

  // Unusable input degrades to the default instead of throwing inside generateMetadata.
  assert.equal(
    String(resolveSiteUrlObject({ NEXT_PUBLIC_SITE_URL: 'not a url' })),
    `${DEFAULT_SITE_URL}/`,
  )
  // `undefined` is only returned when even the fallback is unusable.
  assert.equal(resolveSiteUrlObject({}, 'definitely not a url'), undefined)
})
