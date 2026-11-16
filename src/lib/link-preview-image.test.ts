/**
 * The link card's image route is public, so it is also the one place on the site that fetches an
 * arbitrary address on a reader's behalf. These tests pin the two things that keep that safe — only
 * a plain public `http(s)` address is ever accepted, and only a raster image is ever served back —
 * and the candidate order that prefers page photographs over a bundled fallback.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  imageProxyUrl,
  isAllowedImageType,
  isPrivateHost,
  linkPreviewImageCandidates,
  MAX_IMAGE_BYTES,
  parseImageProxyUrl,
} from './link-preview-image'

test('the proxy accepts a normal public image address', () => {
  const url = parseImageProxyUrl('https://cdn.example.com/photos/lisbon.jpg?w=1200')
  assert.ok(url)
  assert.equal(url.href, 'https://cdn.example.com/photos/lisbon.jpg?w=1200')
  assert.ok(parseImageProxyUrl('http://example.com/favicon.ico'))
  assert.ok(parseImageProxyUrl('https://example.com:443/a.png'))
  assert.ok(parseImageProxyUrl('http://example.com:80/a.png'))
})

test('the proxy refuses anything that is not a plain web address', () => {
  assert.equal(parseImageProxyUrl(null), null)
  assert.equal(parseImageProxyUrl(''), null)
  assert.equal(parseImageProxyUrl('not a url'), null)
  assert.equal(parseImageProxyUrl('file:///etc/passwd'), null)
  assert.equal(parseImageProxyUrl('data:image/png;base64,AAAA'), null)
  assert.equal(parseImageProxyUrl('http://user:secret@example.com/a.png'), null)
  assert.equal(parseImageProxyUrl('https://example.com:8443/a.png'), null)
})

test('the proxy refuses private, loopback and metadata hosts', () => {
  for (const host of [
    'localhost',
    'localhost:443',
    'app.localhost',
    '10.0.0.5',
    '127.0.0.1',
    '169.254.169.254', // cloud metadata
    '172.16.4.2',
    '192.168.1.1',
    '100.64.0.1',
    '198.18.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '[::1]',
    '[::]',
    '[fd00::1]',
    '[fe80::1]',
    '[::ffff:127.0.0.1]',
    'printer.local',
    'metadata.google.internal',
  ]) {
    assert.equal(parseImageProxyUrl(`http://${host}/a.png`), null, host)
  }
})

test('the proxy refuses to be pointed at itself', () => {
  assert.equal(
    parseImageProxyUrl('https://example.com/api/link-preview-image?url=https%3A%2F%2Fx.test'),
    null,
  )
  assert.equal(parseImageProxyUrl('https://example.com/api/link-preview-image/'), null)
})

test('public hostnames and public addresses pass the host check', () => {
  for (const host of [
    'example.com',
    'www.booking.com',
    '8.8.8.8',
    '2606:4700::1111',
    'xn--80ak6aa92e.com',
  ]) {
    assert.equal(isPrivateHost(host), false, host)
  }
})

test('only raster image types are served back', () => {
  for (const type of [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/heic',
    'image/png; charset=binary',
    'IMAGE/PNG',
  ]) {
    assert.equal(isAllowedImageType(type), true, type)
  }

  for (const type of [
    null,
    undefined,
    '',
    'text/html',
    'image/svg+xml', // can carry script, and we serve from our own origin
    'application/octet-stream',
    'image/',
  ]) {
    assert.equal(isAllowedImageType(type), false, String(type))
  }
})

test('the proxy address is relative and encodes the target', () => {
  assert.equal(
    imageProxyUrl('https://cdn.example.com/a b.png?x=1&y=2'),
    '/api/link-preview-image?url=https%3A%2F%2Fcdn.example.com%2Fa%20b.png%3Fx%3D1%26y%3D2',
  )
})

test('page images are tried in order via proxy and directly, then the local photograph', () => {
  assert.deepEqual(
    linkPreviewImageCandidates('https://cdn.example.com/og.jpg', 'example.com', [
      'https://cdn.example.com/body.jpg',
      'https://cdn.example.com/og.jpg',
    ]),
    [
      { src: imageProxyUrl('https://cdn.example.com/og.jpg'), icon: false },
      { src: 'https://cdn.example.com/og.jpg', icon: false },
      { src: imageProxyUrl('https://cdn.example.com/body.jpg'), icon: false },
      { src: 'https://cdn.example.com/body.jpg', icon: false },
      { src: '/images/trips/hero.jpg', icon: false },
    ],
  )
})

test('same-origin images are loaded directly, and unsafe targets never become browser fallbacks', () => {
  assert.deepEqual(
    linkPreviewImageCandidates('/api/media/file/everest-hero.jpg', 'hikeglobally.com'),
    [
      { src: '/api/media/file/everest-hero.jpg', icon: false },
      { src: '/images/trips/hero.jpg', icon: false },
    ],
  )
  assert.deepEqual(linkPreviewImageCandidates('http://localhost/private', 'example.com'), [
    { src: '/images/trips/hero.jpg', icon: false },
  ])
  assert.deepEqual(
    linkPreviewImageCandidates('//cdn.example.com/a.jpg', 'example.com').slice(0, 2),
    [
      { src: imageProxyUrl('https://cdn.example.com/a.jpg'), icon: false },
      { src: 'https://cdn.example.com/a.jpg', icon: false },
    ],
  )
})

test('a page with no image uses a bundled photograph rather than an icon or initial', () => {
  assert.deepEqual(linkPreviewImageCandidates(null, 'example.com'), [
    { src: '/images/trips/hero.jpg', icon: false },
  ])
})

test('the size cap is a sane thumbnail budget', () => {
  assert.equal(MAX_IMAGE_BYTES, 4 * 1024 * 1024)
})
