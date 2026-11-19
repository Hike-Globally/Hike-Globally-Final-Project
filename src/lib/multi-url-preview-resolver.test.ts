import assert from 'node:assert/strict'
import test from 'node:test'

import type { LinkPreviewSource } from './link-preview'
import { resolveMultiUrlPreview } from './multi-url-preview-resolver'
import { resolveSiteUrl } from './site-url'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const source = (...links: LinkPreviewSource[]) => ({ multiPreviewLinks: links })
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('a collection reuses single-link metadata, images, overrides, rating limits and prices per URL', async () => {
  const preview = await resolveMultiUrlPreview(
    {
      ...source(
        {
          linkPreviewUrl: 'https://example.com/one',
          linkPreviewTitle: 'Editor title',
          linkPreviewRating: 8,
          linkPreviewReviewCount: 123,
          linkPreviewPrice: 'US$ 700',
          linkPreviewOriginalPrice: 'US$ 900',
        },
        { linkPreviewUrl: 'https://example.com/two', linkPreviewDescription: 'Editor description' },
      ),
      multiPreviewHeading: ' Worth exploring ',
      multiPreviewLayout: 'carousel',
      multiPreviewAnimation: 'reveal',
    },
    {
      metadata: async (url) => ({
        title: url.endsWith('one') ? 'First page' : 'Second page',
        description: 'Page description',
        image: 'https://images.example.com/hero.jpg',
        images: ['https://images.example.com/second.jpg'],
      }),
    },
  )
  assert.ok(preview)
  assert.equal(preview.heading, 'Worth exploring')
  assert.equal(preview.layout, 'carousel')
  assert.equal(preview.animation, 'reveal')
  assert.equal(preview.cards[0].title, 'Editor title')
  assert.equal(preview.cards[0].description, 'Page description')
  assert.equal(preview.cards[0].rating, 5)
  assert.equal(preview.cards[0].reviewCount, 123)
  assert.equal(preview.cards[0].price, 'US$ 700')
  assert.equal(preview.cards[0].originalPrice, 'US$ 900')
  assert.equal(preview.cards[0].image, 'https://images.example.com/hero.jpg')
  assert.deepEqual(preview.cards[0].imageAlternatives, ['https://images.example.com/second.jpg'])
  assert.equal(preview.cards[1].title, 'Second page')
  assert.equal(preview.cards[1].description, 'Editor description')
  assert.ok(preview.cards.every(({ external }) => external))
})

test('internal links keep real CMS metadata and never make an HTTP self-request, even without images', async () => {
  const url = new URL(resolveSiteUrl())
  const alias = new URL(url)
  alias.hostname = url.hostname.startsWith('www.') ? url.hostname.slice(4) : `www.${url.hostname}`
  alias.pathname = '/blog/alias'
  let requests = 0
  const result = await resolveMultiUrlPreview(
    source(
      { linkPreviewUrl: '/trips/one' },
      { linkPreviewUrl: '/about', linkPreviewTitle: 'About our team' },
      { linkPreviewUrl: alias.href },
    ),
    {
      internal: async (url) =>
        url.endsWith('/trips/one')
          ? {
              title: 'Our trek',
              description: 'Real summary',
              image: new URL('/media/trip.jpg', resolveSiteUrl()).href,
            }
          : null,
      metadata: async () => {
        requests++
        return { title: 'Must not fetch this' }
      },
    },
  )
  assert.ok(result)
  assert.equal(requests, 0)
  assert.equal(result.cards[0].href, '/trips/one')
  assert.equal(result.cards[0].title, 'Our trek')
  assert.equal(result.cards[0].description, 'Real summary')
  assert.equal(result.cards[0].image, '/media/trip.jpg')
  assert.equal(result.cards[1].title, 'About our team')
  assert.ok(result.cards.every(({ external }) => !external))
})

test('concurrent responses may complete out of order, but cards retain the editor’s order', async () => {
  const result = await resolveMultiUrlPreview(
    source(
      ...[0, 1, 2, 3].map((index) => ({
        linkPreviewUrl: `https://example.com/${index}`,
      })),
    ),
    {
      metadata: async (url) => {
        const index = Number(url.at(-1))
        await delay((3 - index) * 5)
        return { title: `Card ${index}` }
      },
    },
  )
  assert.deepEqual(
    result?.cards.map(({ title }) => title),
    ['Card 0', 'Card 1', 'Card 2', 'Card 3'],
  )
})

test('duplicate URLs share work without merging their independent overrides', async () => {
  let metadata = 0
  let internal = 0
  const result = await resolveMultiUrlPreview(
    source(
      { linkPreviewUrl: 'https://example.com/shared', linkPreviewTitle: 'First choice' },
      { linkPreviewUrl: 'https://example.com/shared', linkPreviewTitle: 'Second choice' },
      { linkPreviewUrl: '/trips/shared', linkPreviewPrice: 'US$ 500' },
      { linkPreviewUrl: '/trips/shared', linkPreviewPrice: 'US$ 600' },
    ),
    {
      metadata: async () => {
        metadata++
        await delay(2)
        return { title: 'Shared page' }
      },
      internal: async () => {
        internal++
        await delay(2)
        return { title: 'Our trip', description: '', image: '/media/real.jpg' }
      },
    },
  )
  assert.equal(metadata, 1)
  assert.equal(internal, 1)
  assert.deepEqual(
    result?.cards.map(({ title }) => title),
    ['First choice', 'Second choice', 'Our trip', 'Our trip'],
  )
  assert.deepEqual(
    result?.cards.slice(2).map(({ price }) => price),
    ['US$ 500', 'US$ 600'],
  )
})

test('at most four network resolutions run concurrently for a 12-link section', async () => {
  let active = 0
  let maximum = 0
  const result = await resolveMultiUrlPreview(
    source(
      ...Array.from({ length: 12 }, (_, index) => ({
        linkPreviewUrl: `https://example.com/${index}`,
      })),
    ),
    {
      metadata: async () => {
        active++
        maximum = Math.max(maximum, active)
        await delay(2)
        active--
        return { title: 'Resolved page' }
      },
    },
  )
  assert.equal(maximum, 4)
  assert.equal(result?.cards.length, 12)
})

test('one section budget handles a hung upstream without waiting eight seconds per URL', async () => {
  let requests = 0
  const before = Date.now()
  const result = await resolveMultiUrlPreview(
    source(
      ...Array.from({ length: 12 }, (_, index) => ({
        linkPreviewUrl: `https://example.com/${index}`,
        linkPreviewTitle: `Fallback ${index}`,
      })),
    ),
    {
      metadata: async () => {
        requests++
        return new Promise(() => {})
      },
    },
    { budgetMs: 20 },
  )
  assert.ok(Date.now() - before < 2000, 'the whole batch times out, not one timer per row')
  assert.ok(requests <= 4)
  assert.equal(result?.cards.length, 12)
  assert.equal(result?.cards.at(-1)?.title, 'Fallback 11')
})

test('failed or invalid links do not break other cards, create empty slots or perform unsafe fetches', async () => {
  let requests = 0
  const result = await resolveMultiUrlPreview(
    source(
      { linkPreviewUrl: '' },
      { linkPreviewUrl: 'javascript:alert(1)' },
      { linkPreviewUrl: 'http://localhost' },
      {
        linkPreviewUrl: 'https://example.com/failure',
        linkPreviewPrice: 'US$ 200',
        linkPreviewRating: NaN,
      },
      { linkPreviewUrl: '/blog/local', linkPreviewReviewCount: -2 },
    ),
    {
      metadata: async () => {
        requests++
        throw new Error('Upstream unavailable')
      },
      internal: async () => {
        throw new Error('CMS unavailable')
      },
    },
  )
  assert.equal(requests, 1)
  assert.equal(result?.cards.length, 2)
  assert.equal(result?.cards[0].title, 'example.com')
  assert.equal(result?.cards[0].price, 'US$ 200')
  assert.equal(result?.cards[0].rating, null)
  assert.equal(result?.cards[1].reviewCount, null)
  assert.equal(await resolveMultiUrlPreview(source({ linkPreviewUrl: '' })), null)
})
