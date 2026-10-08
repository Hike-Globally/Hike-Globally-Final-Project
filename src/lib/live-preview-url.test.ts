import assert from 'node:assert/strict'
import test from 'node:test'

import { buildLivePreviewURL, resolveLivePreviewPath, siteLivePreviewURL } from './live-preview-url'

test('resolveLivePreviewPath builds URLs for supported content collections', () => {
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'blog' },
      data: { slug: 'everest-guide' },
      locale: { code: 'en' },
    }),
    '/blog/everest-guide',
  )
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'trips' },
      data: { slug: 'everest-base-camp' },
      locale: { code: 'en' },
    }),
    '/trips/everest-base-camp',
  )
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'destinations' },
      data: { slug: 'khumbu' },
      locale: { code: 'en' },
    }),
    '/destinations/khumbu',
  )
})

test('resolveLivePreviewPath handles homepage, new records, and globals', () => {
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'pages' },
      data: { slug: 'home' },
      locale: { code: 'en' },
    }),
    '/',
  )
  assert.equal(
    resolveLivePreviewPath({
      collectionConfig: { slug: 'blog' },
      data: {},
      locale: { code: 'en' },
    }),
    '/blog',
  )
  assert.equal(
    resolveLivePreviewPath({
      globalConfig: { slug: 'header' },
      data: {},
      locale: { code: 'en' },
    }),
    '/',
  )
})

test('siteLivePreviewURL wraps a storefront path in the authenticated preview route', () => {
  assert.equal(
    siteLivePreviewURL({
      collectionConfig: { slug: 'trips' },
      data: { slug: 'everest-base-camp' },
      locale: { code: 'en' },
    }),
    '/api/live-preview?path=%2Ftrips%2Feverest-base-camp',
  )
  assert.equal(buildLivePreviewURL('/trips/a b'), '/api/live-preview?path=%2Ftrips%2Fa%20b')
})
