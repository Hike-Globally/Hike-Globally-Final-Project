/**
 * The image route is public, so the half worth testing without a network is the half that decides
 * what it will never fetch: a non-web scheme, a private host, a self-referential target. Each of
 * those must be a flat 404 with no outbound request at all — the sandbox has no internet, so these
 * tests also prove the refusal happens *before* `fetch` is reached.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { NextRequest } from 'next/server'

const { GET } = await import('../app/api/link-preview-image/route')

/** Any outbound call would throw here, because this origin does not exist. */
const request = (target: string | null) => {
  const url = new URL('https://hike.test/api/link-preview-image')
  if (target !== null) url.searchParams.set('url', target)
  return GET(new NextRequest(url))
}

test('a missing target is a 404', async () => {
  const response = await request(null)
  assert.equal(response.status, 404)
})

test('a target that is not a plain public web address is a 404', async () => {
  for (const target of [
    'not a url',
    'file:///etc/passwd',
    'data:image/png;base64,AAAA',
    'http://localhost/a.png',
    'http://127.0.0.1:443/a.png',
    'http://169.254.169.254/latest/meta-data',
    'http://192.168.0.10/a.png',
    'https://user:pass@example.com/a.png',
    'https://example.com:8080/a.png',
    'https://hike.test/api/link-preview-image?url=https%3A%2F%2Fexample.com',
  ]) {
    const response = await request(target)
    assert.equal(response.status, 404, target)
  }
})

test('the route answers with no private cache headers of its own on a refusal', async () => {
  // A 404 must not be cached as if it were the picture.
  const response = await request('http://localhost/a.png')
  assert.equal(response.headers.get('cache-control'), null)
})

test('serves CDN image bytes with the linked page as referrer and follows public redirects', async () => {
  const original = globalThis.fetch
  const calls: { url: string; referer: string | null }[] = []
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), referer: new Headers(init?.headers).get('referer') })
    if (calls.length === 1)
      return new Response(null, { status: 302, headers: { location: '/final.png' } })
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { 'content-type': 'image/png' },
    })
  }
  try {
    const url = new URL('https://hike.test/api/link-preview-image')
    url.searchParams.set('url', 'https://93.184.216.34/photo.png')
    url.searchParams.set('page', 'https://publisher.example.com/trek')
    const response = await GET(new NextRequest(url))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/png')
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal((await response.arrayBuffer()).byteLength, 4)
    assert.deepEqual(calls, [
      { url: 'https://93.184.216.34/photo.png', referer: 'https://publisher.example.com/trek' },
      { url: 'https://93.184.216.34/final.png', referer: 'https://publisher.example.com/trek' },
    ])
  } finally {
    globalThis.fetch = original
  }
})
