import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildLivePreviewURL,
  resolveLivePreviewPath,
  resolveViewLiveHref,
  siteLivePreviewURL,
} from './live-preview-url'

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

test('resolveViewLiveHref links published docs to the public page and drafts to the preview route', () => {
  assert.deepEqual(resolveViewLiveHref({ collectionSlug: 'trips', slug: 'everest-base-camp' }), {
    href: '/trips/everest-base-camp',
    isDraftPreview: false,
  })
  assert.deepEqual(resolveViewLiveHref({ collectionSlug: 'pages', slug: 'home' }), {
    href: '/',
    isDraftPreview: false,
  })
  assert.deepEqual(resolveViewLiveHref({ collectionSlug: 'pages', slug: 'about-us' }), {
    href: '/about-us',
    isDraftPreview: false,
  })
  assert.deepEqual(
    resolveViewLiveHref({ collectionSlug: 'blog', slug: 'new-post', published: false }),
    { href: '/api/live-preview?path=%2Fblog%2Fnew-post', isDraftPreview: true },
  )
  assert.deepEqual(resolveViewLiveHref({ globalSlug: 'footer' }), { href: '/', isDraftPreview: false })
})

test('resolveViewLiveHref returns null when there is nothing to view', () => {
  assert.equal(resolveViewLiveHref({ collectionSlug: 'trips', slug: '' }), null)
  assert.equal(resolveViewLiveHref({ collectionSlug: 'trips' }), null)
  assert.equal(resolveViewLiveHref({ collectionSlug: 'media', slug: 'x' }), null)
})
