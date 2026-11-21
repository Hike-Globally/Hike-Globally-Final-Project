/**
 * Tests for the `/sitemap.xml` URL list.
 *
 * The contract under test — the same one the file's own header comments promise:
 *
 *   1. every public URL appears exactly once, spelled exactly as the page's canonical;
 *   2. `<lastmod>` is the document's own `updatedAt`, never "the moment this was generated",
 *      and is omitted rather than invented when there is no real date to use;
 *   3. nothing noindex is listed, and no CMS page is listed under a URL that already belongs to a
 *      dedicated route (`home` → `/`, `trips` → `/trips`, …).
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import type { MetadataRoute } from 'next'

import type { SitemapDocument, SitemapSources } from './sitemap'

// `src/lib/sitemap.ts` reaches `src/lib/seo.ts`, which resolves the origin once at module load, so
// the environment has to be set before the (dynamic) import below.
process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const { buildSitemap, EMPTY_SITEMAP_SOURCES } = await import('./sitemap')
const { placeCategories } = await import('./place-categories')

const ORIGIN = 'https://hikeglobally.com'
const PLACE_URLS = [
  `${ORIGIN}/places`,
  ...placeCategories.map((category) => `${ORIGIN}/places/${category.value}`),
]
const STATIC_ROUTE_COUNT = 9 + PLACE_URLS.length

const document = (overrides: Partial<SitemapDocument> = {}): SitemapDocument => ({
  slug: 'a-document',
  updatedAt: '2026-03-01T08:00:00.000Z',
  noIndex: false,
  ...overrides,
})

const sources = (overrides: Partial<SitemapSources> = {}): SitemapSources => ({
  ...EMPTY_SITEMAP_SOURCES,
  ...overrides,
})

const urls = (entries: MetadataRoute.Sitemap): string[] => entries.map((entry) => entry.url)

/** The entry for an absolute URL; fails the test when the sitemap does not contain it. */
const entryFor = (entries: MetadataRoute.Sitemap, url: string): MetadataRoute.Sitemap[number] => {
  const entry = entries.find((item) => item.url === url)
  assert.ok(entry, `${url} is missing from the sitemap (got ${urls(entries).join(', ')})`)
  return entry
}

/** The `<lastmod>` an entry will carry, or undefined when it claims no date. */
const lastModifiedOf = (entries: MetadataRoute.Sitemap, url: string): unknown =>
  entryFor(entries, url).lastModified

test('URLs are the canonical spelling of each page', () => {
  const entries = buildSitemap(
    sources({
      trips: [document({ slug: 'everest-base-camp' })],
      destinations: [document({ slug: 'khumbu' })],
      posts: [document({ slug: 'training-for-altitude' })],
      pages: [document({ slug: 'about' })],
    }),
  )

  // The homepage is the bare origin — byte for byte what Next.js prints in its <link rel="canonical">.
  assert.deepEqual(urls(entries).slice(0, 8), [
    ORIGIN,
    `${ORIGIN}/trips`,
    `${ORIGIN}/destinations`,
    `${ORIGIN}/blog`,
    `${ORIGIN}/contact`,
    `${ORIGIN}/about`,
    `${ORIGIN}/privacy`,
    `${ORIGIN}/terms`,
  ])

  assert.deepEqual(urls(entries).slice(8), [
    `${ORIGIN}/sitemap`,
    ...PLACE_URLS,
    `${ORIGIN}/trips/everest-base-camp`,
    `${ORIGIN}/destinations/khumbu`,
    `${ORIGIN}/blog/training-for-altitude`,
  ])

  // No trailing slashes, no double slashes anywhere after the scheme.
  for (const url of urls(entries)) {
    assert.doesNotMatch(
      url.replace(/^https?:\/\//, ''),
      /\/$|\/\//,
      `${url} is not a canonical URL`,
    )
  }
})

test('slug segments are percent-encoded, exactly like the canonical', () => {
  const entries = buildSitemap(sources({ pages: [document({ slug: 'café & co' })] }))

  assert.deepEqual(
    entryFor(entries, `${ORIGIN}/caf%C3%A9%20%26%20co`).url,
    `${ORIGIN}/caf%C3%A9%20%26%20co`,
  )
})

test('every published document gets one entry, and no URL appears twice', () => {
  const entries = buildSitemap(
    sources({
      trips: [document({ slug: 'one' }), document({ slug: 'two' })],
      destinations: [document({ slug: 'three' })],
      posts: [document({ slug: 'four' }), document({ slug: 'five' }), document({ slug: 'six' })],
      pages: [document({ slug: 'seven' })],
    }),
  )

  assert.equal(entries.length, STATIC_ROUTE_COUNT + 7)
  assert.equal(new Set(urls(entries)).size, urls(entries).length)
})

test('two documents sharing a slug still produce one entry for that URL', () => {
  const entries = buildSitemap(
    sources({ trips: [document({ slug: 'one' }), document({ slug: 'one' })] }),
  )

  assert.deepEqual(urls(entries), [
    ORIGIN,
    `${ORIGIN}/trips`,
    `${ORIGIN}/destinations`,
    `${ORIGIN}/blog`,
    `${ORIGIN}/contact`,
    `${ORIGIN}/about`,
    `${ORIGIN}/privacy`,
    `${ORIGIN}/terms`,
    `${ORIGIN}/sitemap`,
    ...PLACE_URLS,
    `${ORIGIN}/trips/one`,
  ])
})

test('documents without a slug are skipped', () => {
  const entries = buildSitemap(
    sources({ trips: [document({ slug: null }), document({ slug: '' })] }),
  )

  assert.equal(entries.length, STATIC_ROUTE_COUNT)
})

test('a noindex document is never advertised', () => {
  const entries = buildSitemap(
    sources({
      trips: [document({ slug: 'hidden-trip', noIndex: true }), document({ slug: 'live-trip' })],
      posts: [document({ slug: 'hidden-post', noIndex: true })],
      pages: [document({ slug: 'hidden-page', noIndex: true })],
    }),
  )

  assert.deepEqual(urls(entries).slice(STATIC_ROUTE_COUNT), [`${ORIGIN}/trips/live-trip`])
})

test('a page whose slug a dedicated route owns is not listed a second time', () => {
  const entries = buildSitemap(
    sources({
      pages: [
        // `home` is served at `/`, while `trips`, `blog` and `places` are shadowed by real routes.
        document({ slug: 'home' }),
        document({ slug: 'trips' }),
        document({ slug: 'blog' }),
        document({ slug: 'places' }),
        document({ slug: 'about' }),
      ],
    }),
  )

  assert.deepEqual(
    urls(entries).filter((url) => url === `${ORIGIN}/trips`),
    [`${ORIGIN}/trips`],
  )
  assert.deepEqual(
    urls(entries).filter((url) => url === ORIGIN),
    [ORIGIN],
  )
  assert.deepEqual(urls(entries).slice(STATIC_ROUTE_COUNT), [])
  assert.equal(urls(entries).filter((url) => url === `${ORIGIN}/places`).length, 1)
  assert.equal(urls(entries).filter((url) => url === `${ORIGIN}/about`).length, 1)
})

test('lastmod is the document’s own date, not the generation time', () => {
  const updatedAt = '2026-04-02T10:30:00.000Z'
  const entries = buildSitemap(sources({ trips: [document({ slug: 'everest', updatedAt })] }))

  assert.equal(lastModifiedOf(entries, `${ORIGIN}/trips/everest`), updatedAt)
})

test('listing pages date from the newest document they render', () => {
  const entries = buildSitemap(
    sources({
      trips: [
        document({ slug: 'old', updatedAt: '2026-01-01T00:00:00.000Z' }),
        document({ slug: 'new', updatedAt: '2026-05-05T05:05:00.000Z' }),
      ],
      posts: [document({ slug: 'post', updatedAt: '2026-02-02T00:00:00.000Z' })],
    }),
  )

  assert.equal(lastModifiedOf(entries, `${ORIGIN}/trips`), '2026-05-05T05:05:00.000Z')
  assert.equal(lastModifiedOf(entries, `${ORIGIN}/blog`), '2026-02-02T00:00:00.000Z')
  // `/destinations` renders no destinations here, so it claims no modification time at all.
  assert.equal(lastModifiedOf(entries, `${ORIGIN}/destinations`), undefined)
})

test('the homepage dates from the newest content it renders', () => {
  const entries = buildSitemap(
    sources({
      posts: [document({ slug: 'post', updatedAt: '2026-06-06T06:06:00.000Z' })],
      // The `home` page document feeds `/` even though it never becomes an entry of its own.
      pages: [document({ slug: 'home', updatedAt: '2026-07-07T07:07:00.000Z' })],
    }),
  )

  assert.equal(lastModifiedOf(entries, ORIGIN), '2026-07-07T07:07:00.000Z')
})

test('lastmod is omitted rather than invented when there is no usable date', () => {
  const entries = buildSitemap(sources({ trips: [document({ slug: 'no-date', updatedAt: null })] }))

  assert.equal(lastModifiedOf(entries, `${ORIGIN}/trips/no-date`), undefined)
  // The inquiry page has no collection behind it either: no date beats a date that means nothing.
  assert.equal(lastModifiedOf(entries, `${ORIGIN}/contact`), undefined)
})

test('an unparseable date is ignored instead of being written into the XML', () => {
  const entries = buildSitemap(
    sources({ trips: [document({ slug: 'broken', updatedAt: 'not a date' })] }),
  )

  assert.equal(lastModifiedOf(entries, `${ORIGIN}/trips/broken`), undefined)
})

test('with no content at all the sitemap is still the nine static routes', () => {
  const entries = buildSitemap()

  assert.equal(entries.length, STATIC_ROUTE_COUNT)
  assert.ok(PLACE_URLS.every((url) => urls(entries).includes(url)))
  assert.equal(entryFor(entries, ORIGIN).priority, 1)
  assert.equal(entryFor(entries, ORIGIN).changeFrequency, 'weekly')
  assert.equal(entryFor(entries, `${ORIGIN}/trips`).priority, 0.8)
  assert.equal(entryFor(entries, `${ORIGIN}/trips`).changeFrequency, 'daily')
})
