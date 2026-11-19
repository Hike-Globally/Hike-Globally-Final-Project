import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchLinkPreviewMetadata } from './link-preview'
import { publicPreviewFetch } from './link-preview-public-fetch'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'
const publicAddresses = async () => ['93.184.216.34']

test('batch metadata transport validates the public DNS answer and preserves bounded/cached fetch options', async () => {
  const transport = publicPreviewFetch({
    addresses: async (host) => {
      assert.equal(host, 'example.com')
      return publicAddresses()
    },
    request: async (input, options) => {
      assert.equal(String(input), 'https://example.com/page')
      assert.equal(options?.redirect, 'manual')
      assert.equal((options as { next?: { revalidate: number } }).next?.revalidate, 3600)
      assert.ok(options?.signal)
      return new Response(
        '<title>Real page title</title><meta name="description" content="Real summary">',
        { headers: { 'content-type': 'text/html' } },
      )
    },
  })
  const metadata = await fetchLinkPreviewMetadata('https://example.com/page', transport)
  assert.equal(metadata?.title, 'Real page title')
  assert.equal(metadata?.description, 'Real summary')
})

test('invalid URLs are rejected before DNS or any network request', async () => {
  let lookups = 0
  const transport = publicPreviewFetch({
    addresses: async () => {
      lookups++
      return publicAddresses()
    },
    request: async () => {
      throw new Error('Should not be reached')
    },
  })
  for (const url of [
    'http://localhost',
    'http://10.0.0.1',
    'file:///tmp/test',
    'https://u:p@example.com',
    'https://example.com:9000',
  ]) {
    await assert.rejects(transport(url), /not a public page/)
  }
  assert.equal(lookups, 0)
})

test('a public name cannot return private, mixed or empty DNS answers', async () => {
  let requests = 0
  for (const addresses of [
    [],
    ['127.0.0.1'],
    ['::1'],
    ['169.254.169.254'],
    ['93.184.216.34', '192.168.1.1'],
  ]) {
    const transport = publicPreviewFetch({
      addresses: async () => addresses,
      request: async () => {
        requests++
        return new Response('Blocked')
      },
    })
    await assert.rejects(transport('https://example.com'), /not a public page/)
  }
  assert.equal(requests, 0)
})

test('redirect hops are checked before fetching; public redirects keep the final page as the image base', async () => {
  const calls: string[] = []
  const hosts: string[] = []
  const transport = publicPreviewFetch({
    addresses: async (host) => {
      hosts.push(host)
      return publicAddresses()
    },
    request: async (input) => {
      calls.push(String(input))
      if (calls.length === 1)
        return new Response('', {
          status: 302,
          headers: { location: 'https://other.example.com/folder/page' },
        })
      const response = new Response('<meta property="og:image" content="photo.jpg">', {
        headers: { 'content-type': 'text/html' },
      })
      Object.defineProperty(response, 'url', { value: String(input) })
      return response
    },
  })
  const metadata = await fetchLinkPreviewMetadata('https://example.com/start', transport)
  assert.equal(metadata?.image, 'https://other.example.com/folder/photo.jpg')
  assert.deepEqual(hosts, ['example.com', 'other.example.com'])
  assert.equal(calls.length, 2)
})

test('redirects to private hosts, non-HTTP targets or a private DNS answer never reach the target', async () => {
  for (const location of [
    'http://127.0.0.1/secret',
    'https://metadata.google.internal',
    'file:///etc/passwd',
    'http://private.example.com',
  ]) {
    let requests = 0
    const transport = publicPreviewFetch({
      addresses: async (host) =>
        host === 'private.example.com' ? ['10.0.0.1'] : publicAddresses(),
      request: async () => {
        requests++
        return new Response('', { status: 302, headers: { location } })
      },
    })
    await assert.rejects(transport('https://example.com'), /not a public page/)
    assert.equal(requests, 1, location)
  }
})

test('redirect loops are bounded, aborted requests stop before DNS, and failures fall back cleanly', async () => {
  let requests = 0
  const transport = publicPreviewFetch({
    addresses: publicAddresses,
    request: async () => {
      requests++
      return new Response('', { status: 302, headers: { location: '/again' } })
    },
  })
  assert.equal(await fetchLinkPreviewMetadata('https://example.com', transport), null)
  assert.equal(requests, 4, 'initial request plus at most three redirect hops')
  const signal = AbortSignal.abort(new Error('Budget ended'))
  await assert.rejects(transport('https://example.com', { signal }), /Budget ended/)
  assert.equal(requests, 4)
  const failing = publicPreviewFetch({
    addresses: async () => {
      throw new Error('DNS unavailable')
    },
  })
  assert.equal(await fetchLinkPreviewMetadata('https://example.com', failing), null)
})

test('redirects back to this site or its www alias cannot trigger recursive page renders', async () => {
  for (const location of [
    'https://hikeglobally.com/trips/one',
    'https://www.hikeglobally.com/blog/one',
  ]) {
    let requests = 0
    const transport = publicPreviewFetch({
      addresses: publicAddresses,
      request: async () => {
        requests++
        return new Response('', { status: 302, headers: { location } })
      },
    })
    await assert.rejects(transport('https://example.com'), /not a public page/)
    assert.equal(requests, 1)
  }
})

test('the shared section signal aborts in-flight metadata work, not just the visible timer', async () => {
  const section = new AbortController()
  let requests = 0
  const transport = publicPreviewFetch({
    signal: section.signal,
    addresses: publicAddresses,
    request: async (_input, options) => {
      requests++
      const signal = options!.signal!
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
        queueMicrotask(() => section.abort(new Error('Section budget ended')))
      })
    },
  })
  await assert.rejects(
    transport('https://example.com', { signal: AbortSignal.timeout(1000) }),
    /Section budget ended/,
  )
  await assert.rejects(transport('https://example.com/again'), /Section budget ended/)
  assert.equal(requests, 1)
})
