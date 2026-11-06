/**
 * The trip brochure route re-serves a stored file from the site's own origin. These tests lock the
 * three things that makes risky — URL resolution, redirect limits, and refusing non-http schemes —
 * without needing a database, a network or a running server.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_BROCHURE_REDIRECTS,
  absoluteHttpUrl,
  fetchStoredFile,
  resolveStoredUrl,
} from './trip-brochure-fetch'

const SITE = 'https://hikeglobally.com'

const response = (status: number, headers: Record<string, string> = {}): Response =>
  new Response(status === 200 ? 'bytes' : null, { status, headers })

/** A scripted `fetch`: each URL maps to the response it should return. */
const stub =
  (routes: Record<string, Response>, calls: string[] = []) =>
  async (url: string): Promise<Response> => {
    calls.push(url)
    const found = routes[url]
    if (!found) throw new Error(`unexpected fetch: ${url}`)
    return found
  }

test('root-relative stored URLs resolve against the site origin', () => {
  assert.equal(
    resolveStoredUrl('/api/media/file/everest-brochure.pdf', SITE),
    'https://hikeglobally.com/api/media/file/everest-brochure.pdf',
  )
})

test('absolute storage URLs (Vercel Blob, S3) are used as they are', () => {
  const blob = 'https://abc.public.blob.vercel-storage.com/everest-brochure.pdf'
  assert.equal(resolveStoredUrl(blob, SITE), blob)
})

test('non-http schemes are refused, so the route can never read a local file', () => {
  assert.equal(absoluteHttpUrl('file:///etc/passwd'), null)
  assert.equal(absoluteHttpUrl('javascript:alert(1)'), null)
  assert.equal(absoluteHttpUrl('not a url'), null)
  assert.equal(resolveStoredUrl('file:///etc/passwd', SITE), null)
})

test('a successful fetch returns the upstream response', async () => {
  const calls: string[] = []
  const found = await fetchStoredFile(
    `${SITE}/api/media/file/x.pdf`,
    stub({ [`${SITE}/api/media/file/x.pdf`]: response(200) }, calls),
  )

  assert.ok(found)
  assert.equal(found.status, 200)
  assert.equal(calls.length, 1)
})

test('a CDN redirect is followed', async () => {
  const calls: string[] = []
  const found = await fetchStoredFile(
    `${SITE}/api/media/file/x.pdf`,
    stub(
      {
        [`${SITE}/api/media/file/x.pdf`]: response(302, {
          location: 'https://cdn.example.com/x.pdf',
        }),
        'https://cdn.example.com/x.pdf': response(200),
      },
      calls,
    ),
  )

  assert.ok(found)
  assert.deepEqual(calls, [`${SITE}/api/media/file/x.pdf`, 'https://cdn.example.com/x.pdf'])
})

test('a redirect to a non-http target is refused', async () => {
  const found = await fetchStoredFile(
    `${SITE}/x.pdf`,
    stub({ [`${SITE}/x.pdf`]: response(302, { location: 'file:///etc/passwd' }) }),
  )

  assert.equal(found, null)
})

test('redirect loops stop at the limit instead of hammering a host', async () => {
  const calls: string[] = []
  const found = await fetchStoredFile(
    `${SITE}/loop.pdf`,
    stub({ [`${SITE}/loop.pdf`]: response(302, { location: `${SITE}/loop.pdf` }) }, calls),
  )

  assert.equal(found, null)
  assert.equal(calls.length, MAX_BROCHURE_REDIRECTS + 1)
})

test('a missing file (404) resolves to null, and so does a network error', async () => {
  assert.equal(
    await fetchStoredFile(`${SITE}/x.pdf`, stub({ [`${SITE}/x.pdf`]: response(404) })),
    null,
  )
  assert.equal(
    await fetchStoredFile(`${SITE}/x.pdf`, async () => {
      throw new Error('offline')
    }),
    null,
  )
})
