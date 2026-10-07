import assert from 'node:assert/strict'
import test from 'node:test'

import { buildLivePreviewURL, resolveLivePreviewPath, siteLivePreviewURL } from './live-preview-url'

test('resolveLivePreviewPath builds localized URLs for supported content collections', () => {
  const locale = { code: 'de' }

  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'blog' },
      data: { slug: 'everest-guide' },
      locale,
    }),
    '/de/blog/everest-guide',
  )
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'trips' },
      data: { slug: 'everest-base-camp' },
      locale,
    }),
    '/de/trips/everest-base-camp',
  )
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'destinations' },
      data: { slug: 'khumbu' },
      locale,
    }),
    '/de/destinations/khumbu',
  )
})

test('resolveLivePreviewPath handles homepage, new records, and globals', () => {
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'pages' },
      data: { slug: 'home' },
      locale: { code: 'fr' },
    }),
    '/fr',
  )
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'blog' },
      data: {},
      locale: { code: 'en' },
    }),
    '/en/blog',
  )
  assert.equal(
    resolveLivePreviewPath({
      globalConfig: { slug: 'header' },
      data: {},
      locale: { code: 'fr' },
    }),
    '/fr',
  )
})

test('siteLivePreviewURL wraps a storefront path in the authenticated preview route', () => {
  assert.equal(
    siteLivePreviewURL({
      collectionConfig: { slug: 'trips' },
      data: { slug: 'everest-base-camp' },
      locale: { code: 'en' },
    }),
    '/api/live-preview?path=%2Fen%2Ftrips%2Feverest-base-camp',
  )
  assert.equal(buildLivePreviewURL('/en/trips/a b'), '/api/live-preview?path=%2Fen%2Ftrips%2Fa%20b')
})
